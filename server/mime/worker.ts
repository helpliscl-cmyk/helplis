import type { MimeScrapeJobType, PrismaClient, ScrapeAttempt } from "@prisma/client";
import { parseMimeHtml } from "@/server/mime/parser";
import { applyMimeEstablishmentData } from "@/server/mime/persistence";
import {
  buildMimeUrl,
  DEFAULT_MIME_SCRAPER_CONFIG,
  DEFAULT_SAMPLE_RBDS,
  type MimeScrapeConfig,
} from "@/server/mime/types";
import { prisma } from "@/server/db/client";

export type MimeWorkerFetch = (input: string, init: RequestInit) => Promise<Response>;

export type MimeWorkerOptions = {
  fetcher?: MimeWorkerFetch;
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
  client?: PrismaClient;
  persist?: boolean;
  maxAttemptsPerRun?: number;
};

type WorkerConfigInput = Partial<Omit<MimeScrapeConfig, "concurrency">> & { concurrency?: 1 };

function mergeConfig(input: WorkerConfigInput = {}): MimeScrapeConfig {
  return {
    ...DEFAULT_MIME_SCRAPER_CONFIG,
    ...input,
    concurrency: 1,
  };
}

function parseConfiguration(value: string): MimeScrapeConfig {
  try {
    return mergeConfig(JSON.parse(value) as WorkerConfigInput);
  } catch {
    return DEFAULT_MIME_SCRAPER_CONFIG;
  }
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, Math.max(0, ms));
  });
}

function retryAfterMs(response: Response) {
  const retryAfter = response.headers.get("retry-after");
  if (!retryAfter) return null;
  const seconds = Number.parseInt(retryAfter, 10);
  if (Number.isFinite(seconds)) return seconds * 1_000;
  const date = new Date(retryAfter);
  return Number.isFinite(date.getTime()) ? Math.max(0, date.getTime() - Date.now()) : null;
}

async function waitBetweenRequests(config: MimeScrapeConfig, options: Required<Pick<MimeWorkerOptions, "sleep" | "random">>) {
  const delay = config.minDelayMs + Math.floor(options.random() * config.jitterMs);
  if (delay > 0) await options.sleep(delay);
}

async function fetchWithTimeout(url: string, config: MimeScrapeConfig, fetcher: MimeWorkerFetch) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);
  try {
    return await fetcher(url, {
      headers: { "user-agent": config.userAgent, accept: "text/html,application/xhtml+xml" },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function createMimeScrapeJobForRbds(
  rbds: number[],
  configInput: WorkerConfigInput = {},
  type: MimeScrapeJobType = "SAMPLE",
  client: PrismaClient = prisma,
) {
  const uniqueRbds = [...new Set(rbds.filter((rbd) => Number.isInteger(rbd) && rbd > 0))];
  const config = mergeConfig(configInput);
  const limitedRbds = type === "SAMPLE" ? uniqueRbds.slice(0, config.sampleLimit) : uniqueRbds;

  return client.scrapeJob.create({
    data: {
      type,
      status: "QUEUED",
      totalItems: limitedRbds.length,
      configuration: JSON.stringify({ ...config, rbds: limitedRbds }),
      attempts: {
        create: limitedRbds.map((rbd) => ({
          rbd,
          url: buildMimeUrl(rbd, config.baseUrl),
          requestedUrl: buildMimeUrl(rbd, config.baseUrl),
          status: "PENDING" as const,
        })),
      },
    },
  });
}

export function createSampleMimeScrapeJob(configInput: WorkerConfigInput = {}, client: PrismaClient = prisma) {
  return createMimeScrapeJobForRbds(DEFAULT_SAMPLE_RBDS, configInput, "SAMPLE", client);
}

async function markAttempt(
  client: PrismaClient,
  attempt: ScrapeAttempt,
  data: Partial<
    Pick<
      ScrapeAttempt,
      "status" | "httpStatus" | "errorType" | "errorMessage" | "nextRetryAt" | "finalUrl" | "redirected" | "contentType"
    >
  >,
) {
  return client.scrapeAttempt.update({
    where: { id: attempt.id },
    data: {
      ...data,
      finishedAt: ["SUCCESS", "SKIPPED", "FAILED", "BLOCKED", "NOT_FOUND"].includes(String(data.status))
        ? new Date()
        : undefined,
    },
  });
}

async function shouldSkipRecent(client: PrismaClient, rbd: number, skipRecentDays: number) {
  const establishment = await client.establishment.findUnique({
    where: { rbd },
    select: { id: true, sourceCheckedAt: true },
  });
  if (!establishment?.sourceCheckedAt) return { skip: false, establishmentId: establishment?.id };
  const ageMs = Date.now() - establishment.sourceCheckedAt.getTime();
  return {
    skip: ageMs < skipRecentDays * 24 * 60 * 60 * 1_000,
    establishmentId: establishment.id,
  };
}

export async function runMimeScrapeJob(jobId: string, options: MimeWorkerOptions = {}) {
  const client = options.client ?? prisma;
  const fetcher = options.fetcher ?? fetch;
  const workerSleep = options.sleep ?? sleep;
  const random = options.random ?? Math.random;
  const persist = options.persist ?? true;
  const maxAttemptsPerRun = options.maxAttemptsPerRun ?? Number.POSITIVE_INFINITY;
  const lockOwner = `mime-worker-${process.pid}-${Date.now()}`;
  let consecutiveBlocked = 0;
  let attemptsProcessedThisRun = 0;

  const job = await client.scrapeJob.findUnique({
    where: { id: jobId },
    include: { attempts: { orderBy: { startedAt: "asc" } } },
  });
  if (!job) throw new Error(`ScrapeJob ${jobId} no existe.`);
  if (["CANCELLED", "COMPLETED"].includes(job.status)) return job;

  const config = parseConfiguration(job.configuration);
  const staleLockBefore = new Date(Date.now() - 10 * 60 * 1_000);
  const lock = await client.scrapeJob.updateMany({
    where: {
      id: job.id,
      OR: [{ status: { not: "RUNNING" } }, { lockedAt: { lt: staleLockBefore } }, { lockedAt: null }],
    },
    data: {
      status: "RUNNING",
      startedAt: job.startedAt ?? new Date(),
      lastHeartbeatAt: new Date(),
      lockOwner,
      lockedAt: new Date(),
    },
  });
  if (lock.count !== 1) throw new Error(`ScrapeJob ${jobId} ya está siendo procesado por otro worker.`);

  for (const attempt of job.attempts) {
    const freshJob = await client.scrapeJob.findUnique({
      where: { id: job.id },
      select: { status: true },
    });
    if (!freshJob || ["PAUSED", "CANCELLED"].includes(freshJob.status)) break;
    if (!["PENDING", "RETRY_SCHEDULED", "FAILED"].includes(attempt.status)) continue;
    if (attempt.nextRetryAt && attempt.nextRetryAt > new Date()) continue;
    if (attemptsProcessedThisRun >= maxAttemptsPerRun) break;

    const recent = await shouldSkipRecent(client, attempt.rbd, config.skipRecentDays);
    if (recent.skip) {
      attemptsProcessedThisRun += 1;
      await client.scrapeAttempt.update({
        where: { id: attempt.id },
        data: {
          status: "SKIPPED",
          establishmentId: recent.establishmentId,
          errorType: "RECENTLY_CHECKED",
          errorMessage: `Consultado hace menos de ${config.skipRecentDays} días.`,
          startedAt: new Date(),
          finishedAt: new Date(),
        },
      });
      await client.scrapeJob.update({
        where: { id: job.id },
        data: { processedItems: { increment: 1 }, skippedItems: { increment: 1 }, lastHeartbeatAt: new Date() },
      });
      await waitBetweenRequests(config, { sleep: workerSleep, random });
      continue;
    }

    await client.scrapeAttempt.update({
      where: { id: attempt.id },
      data: { status: "RUNNING", startedAt: new Date(), attemptNumber: { increment: 1 } },
    });
    attemptsProcessedThisRun += 1;

    try {
      const response = await fetchWithTimeout(attempt.url, config, fetcher);
      const httpStatus = response.status;
      const finalUrl = response.url || attempt.url;
      const redirected = finalUrl !== attempt.url;
      const contentType = response.headers.get("content-type");

      if (httpStatus === 403 || httpStatus === 429) {
        consecutiveBlocked += 1;
        const retryAt = new Date(Date.now() + (retryAfterMs(response) ?? config.backoffBaseMs * 2 ** consecutiveBlocked));
        await markAttempt(client, attempt, {
          status: "BLOCKED",
          httpStatus,
          finalUrl,
          redirected,
          contentType,
          errorType: httpStatus === 429 ? "RATE_LIMITED" : "FORBIDDEN",
          errorMessage: `MIME respondió ${httpStatus}; se respetará pausa antes de reintentar.`,
          nextRetryAt: retryAt,
        });
        await client.scrapeJob.update({
          where: { id: job.id },
          data: { processedItems: { increment: 1 }, failedItems: { increment: 1 }, lastHeartbeatAt: new Date() },
        });
        if (consecutiveBlocked >= config.maxConsecutiveBlocked) {
          await client.scrapeJob.update({
            where: { id: job.id },
            data: { status: "PAUSED", pauseReason: `Pausa automática por ${consecutiveBlocked} respuestas 403/429.` },
          });
          break;
        }
        await workerSleep(Math.max(0, retryAt.getTime() - Date.now()));
        continue;
      }

      consecutiveBlocked = 0;

      if (!response.ok) {
        await markAttempt(client, attempt, {
          status: response.status === 404 ? "NOT_FOUND" : "FAILED",
          httpStatus,
          finalUrl,
          redirected,
          contentType,
          errorType: "HTTP_ERROR",
          errorMessage: `MIME respondió HTTP ${httpStatus}.`,
        });
        await client.scrapeJob.update({
          where: { id: job.id },
          data: { processedItems: { increment: 1 }, failedItems: { increment: 1 }, lastHeartbeatAt: new Date() },
        });
        await waitBetweenRequests(config, { sleep: workerSleep, random });
        continue;
      }

      const html = await response.text();
      const parsed = parseMimeHtml(html, attempt.rbd);
      if (!parsed.ok) {
        await markAttempt(client, attempt, {
          status: parsed.errorType === "NOT_FOUND" ? "NOT_FOUND" : "FAILED",
          httpStatus,
          finalUrl,
          redirected,
          contentType,
          errorType: parsed.errorType,
          errorMessage: parsed.errorMessage,
        });
        await client.scrapeJob.update({
          where: { id: job.id },
          data: { processedItems: { increment: 1 }, failedItems: { increment: 1 }, lastHeartbeatAt: new Date() },
        });
        await waitBetweenRequests(config, { sleep: workerSleep, random });
        continue;
      }

      const result = persist ? await applyMimeEstablishmentData(parsed.data, client) : null;
      await client.scrapeAttempt.update({
        where: { id: attempt.id },
        data: {
          status: "SUCCESS",
          httpStatus,
          finalUrl,
          redirected,
          contentType,
          establishmentId: result?.establishment.id,
          finishedAt: new Date(),
        },
      });
      await client.scrapeJob.update({
        where: { id: job.id },
        data: { processedItems: { increment: 1 }, successfulItems: { increment: 1 }, lastHeartbeatAt: new Date() },
      });
    } catch (error) {
      const attemptNumber = attempt.attemptNumber + 1;
      const canRetry = attemptNumber < config.maxRetries;
      const nextRetryAt = canRetry ? new Date(Date.now() + config.backoffBaseMs * 2 ** attemptNumber) : null;
      await markAttempt(client, attempt, {
        status: canRetry ? "RETRY_SCHEDULED" : "FAILED",
        errorType: error instanceof DOMException && error.name === "AbortError" ? "TIMEOUT" : "FETCH_ERROR",
        errorMessage: error instanceof Error ? error.message : "Error desconocido al consultar MIME.",
        nextRetryAt,
      });
      await client.scrapeJob.update({
        where: { id: job.id },
        data: {
          processedItems: canRetry ? undefined : { increment: 1 },
          failedItems: canRetry ? undefined : { increment: 1 },
          lastHeartbeatAt: new Date(),
        },
      });
    }

    await waitBetweenRequests(config, { sleep: workerSleep, random });
  }

  const finalJob = await client.scrapeJob.findUnique({
    where: { id: job.id },
    include: { attempts: true },
  });
  if (!finalJob) throw new Error(`ScrapeJob ${jobId} desapareció durante la ejecución.`);

  const terminalAttempts = finalJob.attempts.filter((attempt) =>
    ["SUCCESS", "SKIPPED", "FAILED", "BLOCKED", "NOT_FOUND"].includes(attempt.status),
  );
  const remaining = finalJob.attempts.length - terminalAttempts.length;
  const hasFailures = finalJob.attempts.some((attempt) => ["FAILED", "BLOCKED", "NOT_FOUND"].includes(attempt.status));

  if (finalJob.status === "RUNNING" && remaining === 0) {
    await client.scrapeJob.update({
      where: { id: job.id },
      data: {
        status: hasFailures ? "COMPLETED_WITH_ERRORS" : "COMPLETED",
        finishedAt: new Date(),
        lastHeartbeatAt: new Date(),
        lockOwner: null,
        lockedAt: null,
      },
    });
  } else if (finalJob.status === "RUNNING" && remaining > 0) {
    await client.scrapeJob.update({
      where: { id: job.id },
      data: {
        status: "QUEUED",
        lastHeartbeatAt: new Date(),
        lockOwner: null,
        lockedAt: null,
      },
    });
  }

  return client.scrapeJob.findUnique({ where: { id: job.id }, include: { attempts: true } });
}

export async function pauseMimeScrapeJob(jobId: string, reason = "Pausado manualmente.", client: PrismaClient = prisma) {
  return client.scrapeJob.update({
    where: { id: jobId },
    data: { status: "PAUSED", pauseReason: reason, lockOwner: null, lockedAt: null },
  });
}

export async function resumeMimeScrapeJob(jobId: string, client: PrismaClient = prisma) {
  return client.scrapeJob.update({
    where: { id: jobId },
    data: { status: "QUEUED", pauseReason: null, lockOwner: null, lockedAt: null },
  });
}

export async function cancelMimeScrapeJob(jobId: string, client: PrismaClient = prisma) {
  return client.scrapeJob.update({
    where: { id: jobId },
    data: { status: "CANCELLED", finishedAt: new Date(), lockOwner: null, lockedAt: null },
  });
}
