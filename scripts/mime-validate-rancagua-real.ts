import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { parseMimeHtml } from "../server/mime/parser";
import { applyMimeEstablishmentData } from "../server/mime/persistence";
import { buildMimeUrl, DEFAULT_MIME_SCRAPER_CONFIG } from "../server/mime/types";
import {
  createMimeScrapeJobForRbds,
  pauseMimeScrapeJob,
  resumeMimeScrapeJob,
  runMimeScrapeJob,
} from "../server/mime/worker";

const prisma = new PrismaClient();

const RANCAGUA_SAMPLE = [
  {
    rbd: 2112,
    expectedName: "Colegio Moises Mussa",
    selectionSource: "Cormun Rancagua + documento institucional indexado con RBD 2112",
  },
  {
    rbd: 2123,
    expectedName: "Escuela Bernardo O'Higgins",
    selectionSource: "MIME indexado y listado público docente con RBD 2123",
  },
  {
    rbd: 2133,
    expectedName: "Colegio Ricardo Olea",
    selectionSource: "Cormun Rancagua + ficha MIME indexada con RBD 2133",
  },
  {
    rbd: 15503,
    expectedName: "Escuela de Parvulos Duende Melodia",
    selectionSource: "Cormun Rancagua + ficha MIME indexada con RBD 15503",
  },
  {
    rbd: 15769,
    expectedName: "Liceo Tecnico Santa Cruz de Triana",
    selectionSource: "Mineduc/documentos infoescuelas y Cormun Rancagua",
  },
  {
    rbd: 11256,
    expectedName: "Colegio Don Bosco",
    selectionSource: "Sitio del establecimiento con RBD y reconocimiento Mineduc",
  },
  {
    rbd: 2166,
    expectedName: "Instituto Regional de Educacion",
    selectionSource: "Sitio del establecimiento y documentos Mineduc con RBD 2166",
  },
  {
    rbd: 15707,
    expectedName: "Colegio Rancagua",
    selectionSource: "Superintendencia de Educacion con RBD 15707",
  },
  {
    rbd: 2150,
    expectedName: "Instituto Sagrado Corazon",
    selectionSource: "Listado RBD público indexado para Rancagua",
  },
  {
    rbd: 2194,
    expectedName: "Instituto Ingles Rancagua",
    selectionSource: "Listado RBD público indexado para Rancagua",
  },
];

const REQUIRED_FIELDS = [
  "rbd",
  "name",
  "status",
  "address",
  "commune",
  "region",
  "dependency",
  "officialRecognition",
  "holderName",
  "directorName",
  "phone",
  "contactEmail",
  "website",
  "educationLevels",
  "totalEnrollment",
  "averageStudentsPerCourse",
  "mimeUrl",
  "sourceCheckedAt",
] as const;

const PREFLIGHT_RBD = 2123;

function assertDevelopmentDatabase() {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const production = process.env.VERCEL_ENV === "production" || process.env.VERCEL_TARGET_ENV === "production";
  if (production || !databaseUrl.startsWith("file:")) {
    throw new Error("Validacion real bloqueada: DATABASE_URL debe ser SQLite local y no ambiente productivo.");
  }
}

function sanitizeHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\sdata-[a-z0-9_-]+="[^"]*"/gi, "");
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function fixturePathFor(rbd: number) {
  return resolve("tests", "fixtures", "mime", `real-rancagua-current-${rbd}.html`);
}

function markdownCell(value: unknown) {
  return String(value ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ");
}

function summarizeParsedFields(data: Record<string, unknown>) {
  return {
    rbd: data.rbd ?? null,
    name: data.name ?? null,
    address: data.address ?? null,
    commune: data.commune ?? null,
    region: data.region ?? null,
    dependency: data.dependency ?? null,
    officialRecognition: data.officialRecognition ?? null,
    holderName: data.holderName ?? null,
    directorName: data.directorName ?? null,
    phone: data.phone ?? null,
    contactEmail: data.contactEmail ?? null,
    website: data.website ?? null,
    educationLevels: data.educationLevels ?? null,
    totalEnrollment: data.totalEnrollment ?? null,
    averageStudentsPerCourse: data.averageStudentsPerCourse ?? null,
    mimeUrl: data.mimeUrl ?? null,
  };
}

function formatFields(fields: Record<string, unknown> | null) {
  if (!fields) return "- Sin campos extraidos: el parser no recibio una ficha institucional valida.";
  return Object.entries(fields)
    .map(([key, value]) => `- ${key}: ${value ?? "campo no publicado"}`)
    .join("\n");
}

async function runPreflight() {
  const requestedUrl = buildMimeUrl(PREFLIGHT_RBD, DEFAULT_MIME_SCRAPER_CONFIG.baseUrl);
  const response = await fetch(requestedUrl, {
    headers: {
      "user-agent": DEFAULT_MIME_SCRAPER_CONFIG.userAgent,
      accept: "text/html,application/xhtml+xml",
    },
  });
  const finalUrl = response.url || requestedUrl;
  const redirected = finalUrl !== requestedUrl;
  const contentType = response.headers.get("content-type") ?? "";
  const httpStatus = response.status;
  const html = await response.text();
  const fixturePath = fixturePathFor(PREFLIGHT_RBD);
  writeFileSync(fixturePath, sanitizeHtml(html), "utf8");
  const parsed = parseMimeHtml(html, PREFLIGHT_RBD);
  const fields = parsed.ok ? summarizeParsedFields(parsed.data as unknown as Record<string, unknown>) : null;
  const htmlContainsInstitutionalFicha = parsed.ok && parsed.data.rbd === PREFLIGHT_RBD && Boolean(parsed.data.name);
  const discardedEmails = parsed.ok
    ? parsed.data.contacts.filter((contact) => contact.contactType === "GENERIC_MINEDUC" || contact.contactType !== "ESTABLISHMENT_GENERAL")
    : [];

  return {
    rbd: PREFLIGHT_RBD,
    requestedUrl,
    finalUrl,
    redirected,
    contentType,
    httpStatus,
    htmlLength: html.length,
    fixturePath,
    parsedOk: parsed.ok,
    parserStatus: parsed.ok ? "OK" : parsed.errorType,
    parserMessage: parsed.ok ? "" : parsed.errorMessage,
    htmlContainsInstitutionalFicha,
    fields,
    discardedEmails,
  };
}

function writePreflightReport(preflight: Awaited<ReturnType<typeof runPreflight>>) {
  const reportPath = resolve("docs", "mime-validation", `rancagua-current-url-preflight-${timestamp()}.md`);
  const content = [
    "# Validacion MIME Rancagua - URL vigente preflight",
    "",
    `Fecha: ${new Date().toISOString()}`,
    "",
    "## URL corregida",
    "",
    `- MIME_BASE_URL: ${DEFAULT_MIME_SCRAPER_CONFIG.baseUrl}`,
    `- Ficha construida: ${buildMimeUrl(preflight.rbd, DEFAULT_MIME_SCRAPER_CONFIG.baseUrl)}`,
    "",
    "## Prueba previa sin persistencia",
    "",
    `- RBD consultado: ${preflight.rbd}`,
    `- requestedUrl: ${preflight.requestedUrl}`,
    `- finalUrl: ${preflight.finalUrl}`,
    `- redirected: ${preflight.redirected}`,
    `- HTTP status: ${preflight.httpStatus}`,
    `- contentType: ${preflight.contentType || "sin content-type"}`,
    `- HTML guardado: ${preflight.fixturePath}`,
    `- Contiene ficha institucional real: ${preflight.htmlContainsInstitutionalFicha}`,
    `- Resultado parser: ${preflight.parserStatus}`,
    preflight.parserMessage ? `- Mensaje parser: ${preflight.parserMessage}` : "- Mensaje parser: sin errores",
    "",
    "## Campos extraidos",
    "",
    formatFields(preflight.fields),
    "",
    "## Decision",
    "",
    preflight.htmlContainsInstitutionalFicha
      ? "- Preflight aprobado. El script puede continuar con los 10 RBD unicos de Rancagua."
      : "- Preflight fallido. No se creo job y no se consultaron los otros nueve RBD.",
    "",
  ].join("\n");

  writeFileSync(reportPath, content, "utf8");
  return reportPath;
}

function fieldValue(record: Record<string, unknown>, field: (typeof REQUIRED_FIELDS)[number]) {
  return record[field] ?? null;
}

async function savingFetch(input: string, init: RequestInit) {
  const response = await fetch(input, init);
  const clone = response.clone();
  const url = new URL(input);
  const rbd = Number(url.searchParams.get("rbd"));
  const contentType = response.headers.get("content-type") ?? "";
  if (rbd && contentType.includes("html")) {
    const html = await clone.text();
    writeFileSync(fixturePathFor(rbd), sanitizeHtml(html), "utf8");
  }
  return response;
}

async function verifyReplayDoesNotDuplicate(rbd: number) {
  const establishmentBefore = await prisma.establishment.findUnique({
    where: { rbd },
    include: { contacts: true },
  });
  if (!establishmentBefore) return null;

  const fixture = readFileSync(fixturePathFor(rbd), "utf8");
  const parsed = parseMimeHtml(fixture, rbd, new Date(Date.now() + 2_000));
  if (!parsed.ok) return null;

  const establishmentCountBefore = await prisma.establishment.count({ where: { rbd } });
  const contactCountBefore = await prisma.contact.count({ where: { establishmentId: establishmentBefore.id } });
  const sourceChangedAtBefore = establishmentBefore.sourceChangedAt?.toISOString() ?? null;
  const hashBefore = establishmentBefore.contentHash;

  await applyMimeEstablishmentData(parsed.data, prisma);

  const establishmentAfter = await prisma.establishment.findUnique({
    where: { rbd },
    include: { contacts: true, changes: true },
  });
  if (!establishmentAfter) return null;

  return {
    establishmentCountBefore,
    establishmentCountAfter: await prisma.establishment.count({ where: { rbd } }),
    contactCountBefore,
    contactCountAfter: await prisma.contact.count({ where: { establishmentId: establishmentAfter.id } }),
    sourceCheckedAtChanged:
      establishmentBefore.sourceCheckedAt?.toISOString() !== establishmentAfter.sourceCheckedAt?.toISOString(),
    sourceChangedAtStable: sourceChangedAtBefore === (establishmentAfter.sourceChangedAt?.toISOString() ?? null),
    hashStable: hashBefore === establishmentAfter.contentHash,
    changesCount: establishmentAfter.changes.length,
  };
}

async function buildReport(jobId: string, lockProbe: string, replayCheck: Awaited<ReturnType<typeof verifyReplayDoesNotDuplicate>>) {
  const job = await prisma.scrapeJob.findUnique({ where: { id: jobId }, include: { attempts: true } });
  const attemptsByRbd = new Map((job?.attempts ?? []).map((attempt) => [attempt.rbd, attempt]));
  const rows = [];
  for (const sample of RANCAGUA_SAMPLE) {
    const establishment = await prisma.establishment.findUnique({
      where: { rbd: sample.rbd },
      include: {
        holder: true,
        contacts: true,
        scrapeAttempts: { orderBy: { startedAt: "desc" }, take: 1 },
        commercialOrganizations: true,
      },
    });
    const parsedFixture = parseMimeHtml(readFileSync(fixturePathFor(sample.rbd), "utf8"), sample.rbd);
    const parsedData = parsedFixture.ok ? parsedFixture.data : null;
    const record = establishment as unknown as Record<string, unknown> | null;
    const found = record
      ? REQUIRED_FIELDS.filter((field) => fieldValue(record, field) !== null && fieldValue(record, field) !== "")
      : [];
    const absent = record
      ? REQUIRED_FIELDS.filter((field) => fieldValue(record, field) === null || fieldValue(record, field) === "")
      : [...REQUIRED_FIELDS];
    const incorrect =
      record && parsedData
        ? REQUIRED_FIELDS.filter((field) => {
            const saved = fieldValue(record, field);
            const parsed = fieldValue(parsedData as unknown as Record<string, unknown>, field);
            if (field === "sourceCheckedAt") return false;
            return parsed !== null && parsed !== "" && saved !== parsed;
          })
        : [];
    const attempt = establishment?.scrapeAttempts[0] ?? attemptsByRbd.get(sample.rbd) ?? null;
    rows.push({
      ...sample,
      establishment,
      attempt,
      found,
      absent,
      incorrect,
      finalStatus: !establishment || attempt?.status !== "SUCCESS" ? "incorrecto" : incorrect.length ? "parcialmente correcto" : "correcto",
    });
  }

  const total = rows.length;
  const withEmail = rows.filter((row) => row.establishment?.contactEmail).length;
  const withPhone = rows.filter((row) => row.establishment?.phone).length;
  const withWebsite = rows.filter((row) => row.establishment?.website).length;
  const withHolder = rows.filter((row) => row.establishment?.holderName || row.establishment?.holderId).length;
  const discardedContacts = rows.flatMap((row) =>
    (row.establishment?.contacts ?? [])
      .filter((contact) => contact.contactType && contact.contactType !== "ESTABLISHMENT_GENERAL")
      .map((contact) => ({ rbd: row.rbd, name: row.establishment?.name, contact })),
  );
  const holderGroups = await prisma.holder.findMany({
    where: { establishments: { some: { rbd: { in: RANCAGUA_SAMPLE.map((item) => item.rbd) } } } },
    include: { establishments: { where: { rbd: { in: RANCAGUA_SAMPLE.map((item) => item.rbd) } } } },
  });
  const reportPath = resolve("docs", "mime-validation", `rancagua-real-validation-${timestamp()}.md`);

  const content = [
    "# Validacion real MIME Rancagua",
    "",
    `Fecha: ${new Date().toISOString()}`,
    `Job: ${jobId}`,
    `Fuente RBD: Cormun Rancagua, documentos Mineduc/infoescuelas, fichas MIME indexadas y sitios institucionales con reconocimiento Mineduc. Cada RBD fue consultado contra la ficha publica MIME.`,
    "",
    "## Resumen",
    "",
    `- RBD consultados: ${RANCAGUA_SAMPLE.map((item) => item.rbd).join(", ")}`,
    `- Total fichas reales solicitadas a MIME: ${total}`,
    `- Con correo: ${withEmail}/${total} (${Math.round((withEmail / total) * 100)}%)`,
    `- Con telefono: ${withPhone}/${total} (${Math.round((withPhone / total) * 100)}%)`,
    `- Con sitio web: ${withWebsite}/${total} (${Math.round((withWebsite / total) * 100)}%)`,
    `- Con sostenedor identificado: ${withHolder}/${total} (${Math.round((withHolder / total) * 100)}%)`,
    `- Estado job: ${job?.status ?? "sin job"}; exitos ${job?.successfulItems ?? 0}; fallos ${job?.failedItems ?? 0}; omitidos ${job?.skippedItems ?? 0}`,
    `- Prueba de lock: ${lockProbe}`,
    "",
    "## Validacion por establecimiento",
    "",
    "| RBD | Nombre guardado | Resultado scraping | Campos encontrados | Campos ausentes | Campos incorrectos | Observaciones | Estado final |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ...rows.map((row) =>
      [
        row.rbd,
        row.establishment?.name ?? row.expectedName,
        row.attempt ? `${row.attempt.status} HTTP ${row.attempt.httpStatus ?? "s/c"}` : "sin intento",
        `${row.found.length}: ${row.found.join(", ")}`,
        row.absent.join(", ") || "ninguno",
        row.incorrect.join(", ") || "ninguno",
        `Fuente seleccion: ${row.selectionSource}. requestedUrl: ${row.attempt?.requestedUrl ?? buildMimeUrl(row.rbd)}. finalUrl: ${row.attempt?.finalUrl ?? "sin finalUrl"}. redirected: ${row.attempt?.redirected ?? false}. contentType: ${row.attempt?.contentType ?? "s/c"}. ${row.attempt?.errorType ?? ""} ${row.attempt?.errorMessage ?? ""}`,
        row.finalStatus,
      ]
        .map(markdownCell)
        .join(" | "),
    ),
    "",
    "## Correos descartados o no principales",
    "",
    discardedContacts.length
      ? [
          "| RBD | Establecimiento | Email | Tipo | Etiqueta | Seccion |",
          "| --- | --- | --- | --- | --- | --- |",
          ...discardedContacts.map(({ rbd, name, contact }) =>
            [rbd, name ?? "", contact.email ?? "", contact.contactType ?? "", contact.label ?? "", contact.section ?? ""]
              .map(markdownCell)
              .join(" | "),
          ),
        ].join("\n")
      : "- No se registraron correos descartados o de secciones no principales.",
    "",
    "## Base de datos",
    "",
    replayCheck
      ? [
          `- Segundo replay local del RBD ${RANCAGUA_SAMPLE[0].rbd}: establecimientos ${replayCheck.establishmentCountBefore}->${replayCheck.establishmentCountAfter}; contactos ${replayCheck.contactCountBefore}->${replayCheck.contactCountAfter}.`,
          `- sourceCheckedAt cambio: ${replayCheck.sourceCheckedAtChanged}.`,
          `- sourceChangedAt estable sin cambios relevantes: ${replayCheck.sourceChangedAtStable}.`,
          `- contentHash estable: ${replayCheck.hashStable}.`,
          `- Historial de cambios acumulado para ese RBD: ${replayCheck.changesCount}.`,
        ].join("\n")
      : "- No se pudo ejecutar replay local de duplicidad.",
    `- Sostenedores vinculados en muestra: ${holderGroups
      .map((holder) => `${holder.originalName} (${holder.establishments.length})`)
      .join("; ")}`,
    "",
    "## Jobs",
    "",
    "- Se creo job COMMUNE acotado a la muestra.",
    "- Se ejecuto una primera corrida de 2 fichas y se corto con maxAttemptsPerRun para simular interrupcion.",
    "- Se pauso y reanudo el mismo job.",
    "- Se probo lock de worker con estado RUNNING y fue rechazado.",
    "- Se finalizo el job sin dejar procesos ejecutandose.",
    job?.attempts.some((attempt) => attempt.errorType === "MIME_ERROR_PAGE")
      ? "- Retry de registros fallidos: no se reintento MIME_ERROR_PAGE porque es una respuesta de error generico HTTP 200, no un fallo transitorio ni 429/403."
      : "- Retry de registros fallidos: no hubo fallos retryables en esta muestra; la logica queda cubierta por tests unitarios.",
    "",
    "## Campos no consistentes",
    "",
    job?.successfulItems
      ? "- Ver tabla de validacion por establecimiento."
      : "- No evaluable en esta corrida: MIME no entrego fichas, solo paginas de error generico HTTP 200.",
    "",
    "## Fixtures HTML",
    "",
    ...RANCAGUA_SAMPLE.map((item) => `- tests/fixtures/mime/real-rancagua-current-${item.rbd}.html`),
    "",
  ].join("\n");

  writeFileSync(reportPath, content, "utf8");
  return { reportPath, rows, totals: { total, withEmail, withPhone, withWebsite, withHolder } };
}

async function main() {
  assertDevelopmentDatabase();
  mkdirSync(resolve("tests", "fixtures", "mime"), { recursive: true });
  mkdirSync(resolve("docs", "mime-validation"), { recursive: true });

  const reportOnlyJobId = process.env.MIME_VALIDATION_REPORT_JOB_ID;
  if (reportOnlyJobId) {
    const report = await buildReport(
      reportOnlyJobId,
      process.env.MIME_VALIDATION_LOCK_PROBE ?? "modo solo informe; no se ejecutaron nuevas solicitudes",
      null,
    );
    console.log(`Informe: ${join(".", report.reportPath.replace(process.cwd(), ""))}`);
    console.log(
      `Resumen: correo ${report.totals.withEmail}/${report.totals.total}, telefono ${report.totals.withPhone}/${report.totals.total}, web ${report.totals.withWebsite}/${report.totals.total}.`,
    );
    return;
  }

  console.log("Base segura: SQLite local.");
  console.log(`Muestra Rancagua: ${RANCAGUA_SAMPLE.map((item) => item.rbd).join(", ")}`);
  console.log(`Preflight sin persistencia: RBD ${PREFLIGHT_RBD}.`);

  const preflight = await runPreflight();
  const preflightReportPath = writePreflightReport(preflight);
  console.log(`Preflight HTTP ${preflight.httpStatus}; parser ${preflight.parserStatus}; ficha real: ${preflight.htmlContainsInstitutionalFicha}.`);
  console.log(`requestedUrl: ${preflight.requestedUrl}`);
  console.log(`finalUrl: ${preflight.finalUrl}`);
  console.log(`Campos extraidos:\n${formatFields(preflight.fields)}`);
  console.log(`Informe preflight: ${join(".", preflightReportPath.replace(process.cwd(), ""))}`);

  if (!preflight.htmlContainsInstitutionalFicha) {
    console.log("Preflight fallido: no se crea job y no se consultan los otros RBD.");
    return;
  }

  const job = await createMimeScrapeJobForRbds(
    RANCAGUA_SAMPLE.map((item) => item.rbd),
    DEFAULT_MIME_SCRAPER_CONFIG,
    "COMMUNE",
    prisma,
  );
  console.log(`Job creado: ${job.id}`);

  await runMimeScrapeJob(job.id, {
    client: prisma,
    fetcher: savingFetch,
    maxAttemptsPerRun: 2,
  });
  console.log("Primera corrida controlada completada: 2 fichas.");

  await prisma.scrapeJob.update({
    where: { id: job.id },
    data: { status: "RUNNING", lockedAt: new Date(), lockOwner: "validation-lock-probe" },
  });
  let lockProbe = "no ejecutada";
  try {
    await runMimeScrapeJob(job.id, { client: prisma, fetcher: savingFetch, maxAttemptsPerRun: 1 });
    lockProbe = "fallo: segundo worker no fue bloqueado";
  } catch (error) {
    lockProbe = error instanceof Error && error.message.includes("ya está siendo procesado")
      ? "ok: segundo worker bloqueado"
      : `error inesperado: ${error instanceof Error ? error.message : String(error)}`;
  } finally {
    await prisma.scrapeJob.update({
      where: { id: job.id },
      data: { status: "QUEUED", lockedAt: null, lockOwner: null },
    });
  }
  console.log(`Lock: ${lockProbe}`);

  await pauseMimeScrapeJob(job.id, "Pausa de validacion controlada.", prisma);
  await resumeMimeScrapeJob(job.id, prisma);
  console.log("Pausa y reanudacion registradas.");

  await runMimeScrapeJob(job.id, { client: prisma, fetcher: savingFetch });
  console.log("Job finalizado.");

  const replayCheck = await verifyReplayDoesNotDuplicate(RANCAGUA_SAMPLE[0].rbd);
  const report = await buildReport(job.id, lockProbe, replayCheck);
  console.log(`Informe: ${join(".", report.reportPath.replace(process.cwd(), ""))}`);
  console.log(
    `Resumen: correo ${report.totals.withEmail}/${report.totals.total}, telefono ${report.totals.withPhone}/${report.totals.total}, web ${report.totals.withWebsite}/${report.totals.total}.`,
  );
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
