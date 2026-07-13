import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { buildMimeUrl } from "@/server/mime/types";
import { runMimeScrapeJob } from "@/server/mime/worker";

function fixture(name: string) {
  return readFileSync(join(process.cwd(), "tests", "fixtures", "mime", name), "utf8");
}

function applyData<T extends Record<string, unknown>>(target: T, data: Record<string, unknown>) {
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (typeof value === "object" && value && "increment" in value) {
      target[key as keyof T] = (Number(target[key as keyof T] ?? 0) + Number((value as { increment: number }).increment)) as T[keyof T];
    } else {
      target[key as keyof T] = value as T[keyof T];
    }
  }
}

function makeClient(config: Record<string, unknown>) {
  const attempt = {
    id: "attempt_1",
    jobId: "job_1",
    establishmentId: null,
    rbd: 8927,
    url: buildMimeUrl(8927),
    requestedUrl: buildMimeUrl(8927),
    finalUrl: null,
    redirected: false,
    contentType: null,
    status: "PENDING",
    httpStatus: null,
    attemptNumber: 1,
    errorType: null,
    errorMessage: null,
    startedAt: null,
    finishedAt: null,
    nextRetryAt: null,
  };
  const job = {
    id: "job_1",
    type: "SAMPLE",
    status: "QUEUED",
    totalItems: 1,
    processedItems: 0,
    successfulItems: 0,
    failedItems: 0,
    skippedItems: 0,
    startedAt: null,
    finishedAt: null,
    lastHeartbeatAt: null,
    configuration: JSON.stringify({
      minDelayMs: 0,
      jitterMs: 0,
      maxRetries: 1,
      backoffBaseMs: 1,
      requestTimeoutMs: 50,
      maxConsecutiveBlocked: 3,
      skipRecentDays: 30,
      sampleLimit: 5,
      userAgent: "test",
      ...config,
    }),
    lockOwner: null,
    lockedAt: null,
    pauseReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    attempts: [attempt],
  };

  return {
    job,
    attempt,
    client: {
      scrapeJob: {
        findUnique: async (args: { include?: unknown; select?: { status?: boolean } }) => {
          if (args.select?.status) return { status: job.status };
          return args.include ? { ...job, attempts: [attempt] } : job;
        },
        updateMany: async (args: { data: Record<string, unknown> }) => {
          if (job.status === "RUNNING" && job.lockedAt) return { count: 0 };
          applyData(job, args.data);
          return { count: 1 };
        },
        update: async (args: { data: Record<string, unknown> }) => {
          applyData(job, args.data);
          return job;
        },
      },
      scrapeAttempt: {
        update: async (args: { data: Record<string, unknown> }) => {
          applyData(attempt, args.data);
          return attempt;
        },
      },
      establishment: {
        findUnique: async () => null,
      },
    } as unknown as PrismaClient,
  };
}

describe("worker MIME", () => {
  it("procesa una ficha exitosa sin persistir en pruebas", async () => {
    const { client, job, attempt } = makeClient({});
    await runMimeScrapeJob("job_1", {
      client,
      persist: false,
      sleep: async () => undefined,
      random: () => 0,
      fetcher: async () => new Response(fixture("complete.html"), { status: 200 }),
    });
    expect(attempt.status).toBe("SUCCESS");
    expect(job.status).toBe("COMPLETED");
    expect(job.successfulItems).toBe(1);
  });

  it("pausa ante múltiples respuestas 429 respetando la protección", async () => {
    const { client, job, attempt } = makeClient({ maxConsecutiveBlocked: 1 });
    await runMimeScrapeJob("job_1", {
      client,
      persist: false,
      sleep: async () => undefined,
      random: () => 0,
      fetcher: async () => new Response("", { status: 429, headers: { "retry-after": "1" } }),
    });
    expect(attempt.status).toBe("BLOCKED");
    expect(job.status).toBe("PAUSED");
    expect(job.pauseReason).toContain("403/429");
  });

  it("registra redireccion sin fallar cuando la ficha sigue siendo valida", async () => {
    const { client, attempt } = makeClient({});
    await runMimeScrapeJob("job_1", {
      client,
      persist: false,
      sleep: async () => undefined,
      random: () => 0,
      fetcher: async () => {
        const response = new Response(fixture("complete.html"), {
          status: 200,
          headers: { "content-type": "text/html;charset=UTF-8" },
        });
        Object.defineProperty(response, "url", { value: `${buildMimeUrl(8927)}&redirected=true` });
        return response;
      },
    });
    expect(attempt.status).toBe("SUCCESS");
    expect(attempt.redirected).toBe(true);
    expect(attempt.finalUrl).toBe(`${buildMimeUrl(8927)}&redirected=true`);
    expect(attempt.contentType).toBe("text/html;charset=UTF-8");
  });

  it("marca timeout como fallo sin reintentos ilimitados", async () => {
    const { client, job, attempt } = makeClient({ maxRetries: 1 });
    await runMimeScrapeJob("job_1", {
      client,
      persist: false,
      sleep: async () => undefined,
      random: () => 0,
      fetcher: async () => {
        throw new DOMException("timeout", "AbortError");
      },
    });
    expect(attempt.status).toBe("FAILED");
    expect(attempt.errorType).toBe("TIMEOUT");
    expect(job.failedItems).toBe(1);
  });

  it("bloquea un segundo worker sobre el mismo job", async () => {
    const { client, job } = makeClient({});
    job.status = "RUNNING";
    job.lockedAt = new Date() as never;
    await expect(
      runMimeScrapeJob("job_1", {
        client,
        persist: false,
        sleep: async () => undefined,
        random: () => 0,
        fetcher: async () => new Response(fixture("complete.html"), { status: 200 }),
      }),
    ).rejects.toThrow("ya está siendo procesado");
  });
});
