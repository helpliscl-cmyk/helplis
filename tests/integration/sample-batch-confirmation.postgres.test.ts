import crypto from "node:crypto";
import { beforeAll, afterAll, describe, expect, it } from "vitest";

const databaseUrl = process.env.TEST_POSTGRES_DATABASE_URL;
const describePostgres = databaseUrl ? describe : describe.skip;
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const runId = crypto.randomBytes(5).toString("hex");
const referencePrefix = `TEST-SAMPLE-${runId}`;
let prisma: import("@prisma/client").PrismaClient;
let confirmSamplePreviewBatch: typeof import("@/server/operations/sample-batch-preview").confirmSamplePreviewBatch;
let encodeSampleUnits: typeof import("@/server/operations/sample-batch-preview").encodeSampleUnits;
let actorUserId: string;

function codeFor(seed: string) {
  const digest = crypto.createHash("sha256").update(`${runId}:${seed}`).digest();
  return Array.from({ length: 8 }, (_, index) => alphabet[digest[index] % alphabet.length]).join("");
}

function unitsFor(reference: string, seed: string) {
  return Array.from({ length: 5 }, (_, index) => {
    const publicCode = codeFor(`${seed}:${index}`);
    const publicUrl = `https://helplis.cl/p/${publicCode}`;
    return {
      wristbandReference: `W-${String(index + 1).padStart(3, "0")}`,
      publicCode,
      publicUrl,
      qrContent: publicUrl,
      nfcContent: publicUrl,
      qrFilename: `${publicCode}.svg`,
      batchReference: reference,
      initialState: "UNACTIVATED" as const,
    };
  });
}

async function cleanupReference(reference: string) {
  const batches = await prisma.batch.findMany({ where: { internalReference: reference }, select: { id: true } });
  const batchIds = batches.map((batch) => batch.id);
  if (batchIds.length) {
    await prisma.auditLog.deleteMany({ where: { entityId: { in: batchIds } } });
    await prisma.device.deleteMany({ where: { batchId: { in: batchIds } } });
    await prisma.batch.deleteMany({ where: { id: { in: batchIds } } });
  }
}

async function cleanupAll() {
  const batches = await prisma.batch.findMany({
    where: { internalReference: { startsWith: referencePrefix } },
    select: { id: true },
  });
  const batchIds = batches.map((batch) => batch.id);
  if (batchIds.length) {
    await prisma.auditLog.deleteMany({ where: { entityId: { in: batchIds } } });
    await prisma.device.deleteMany({ where: { batchId: { in: batchIds } } });
    await prisma.batch.deleteMany({ where: { id: { in: batchIds } } });
  }
  await prisma.device.deleteMany({ where: { publicCode: { startsWith: "TST" } } });
  if (actorUserId) {
    await prisma.auditLog.deleteMany({ where: { actorUserId } });
    await prisma.user.deleteMany({ where: { id: actorUserId } });
  }
}

async function expectConfirmationCode(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toMatchObject({ code });
}

describePostgres("sample batch confirmation on PostgreSQL", () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    process.env.DIRECT_URL = process.env.DIRECT_URL || databaseUrl;
    process.env.AUTH_SECRET = "test-postgres-secret-with-at-least-32-characters";

    const client = await import("@prisma/client");
    const operations = await import("@/server/operations/sample-batch-preview");
    prisma = new client.PrismaClient();
    confirmSamplePreviewBatch = operations.confirmSamplePreviewBatch;
    encodeSampleUnits = operations.encodeSampleUnits;
    actorUserId = crypto.randomUUID();

    await prisma.user.create({
      data: {
        id: actorUserId,
        email: `sample-confirm-${runId}@test.helplis.cl`,
        name: "Sample Confirm Test",
        passwordHash: "test-only",
        role: "SUPER_ADMIN",
        status: "ACTIVE",
      },
    });
  }, 30_000);

  afterAll(async () => {
    await cleanupAll();
    await prisma.$disconnect();
  }, 30_000);

  it("confirms exactly five devices and creates an audit log without activationCode", async () => {
    const reference = `${referencePrefix}-SUCCESS`;
    const units = unitsFor(reference, "success");
    const batch = await confirmSamplePreviewBatch({
      encodedUnits: encodeSampleUnits(units),
      actorUserId,
      confirmedIrreversible: true,
      batchReference: reference,
    });

    const devices = await prisma.device.findMany({ where: { batchId: batch.id }, orderBy: { internalSequence: "asc" } });
    const auditLog = await prisma.auditLog.findFirst({ where: { entityId: batch.id, action: "SAMPLE_BATCH_CONFIRMED" } });

    expect(devices.map((device) => device.publicCode)).toEqual(units.map((unit) => unit.publicCode));
    expect(devices).toHaveLength(5);
    expect(devices.every((device, index) => device.publicUrl === units[index].publicUrl)).toBe(true);
    expect(devices.every((device) => device.activationCodeHash && device.activationCodeEncrypted)).toBe(true);
    expect(auditLog?.newData).not.toMatch(/activationCode/i);
    expect(JSON.parse(auditLog?.newData ?? "{}")).toMatchObject({
      internalReference: reference,
      quantity: 5,
      secretCredentialsIncluded: false,
    });
  });

  it("returns BATCH_REFERENCE_ALREADY_EXISTS for duplicate reference and keeps the original batch", async () => {
    const reference = `${referencePrefix}-DUP-REF`;
    await confirmSamplePreviewBatch({
      encodedUnits: encodeSampleUnits(unitsFor(reference, "dup-ref-a")),
      actorUserId,
      confirmedIrreversible: true,
      batchReference: reference,
    });

    await expectConfirmationCode(
      confirmSamplePreviewBatch({
        encodedUnits: encodeSampleUnits(unitsFor(reference, "dup-ref-b")),
        actorUserId,
        confirmedIrreversible: true,
        batchReference: reference,
      }),
      "BATCH_REFERENCE_ALREADY_EXISTS",
    );

    expect(await prisma.batch.count({ where: { internalReference: reference } })).toBe(1);
    await cleanupReference(reference);
  });

  it("returns PUBLIC_CODE_COLLISION and does not create a batch", async () => {
    const reference = `${referencePrefix}-PUBLIC-CODE`;
    const units = unitsFor(reference, "public-code");
    await prisma.device.create({
      data: {
        publicCode: units[0].publicCode,
        publicUrl: units[0].publicUrl,
        qrContent: units[0].qrContent,
        nfcContent: units[0].nfcContent,
        activationCodeHash: "test-hash",
      },
    });

    await expectConfirmationCode(
      confirmSamplePreviewBatch({
        encodedUnits: encodeSampleUnits(units),
        actorUserId,
        confirmedIrreversible: true,
        batchReference: reference,
      }),
      "PUBLIC_CODE_COLLISION",
    );

    expect(await prisma.batch.count({ where: { internalReference: reference } })).toBe(0);
    await prisma.device.deleteMany({ where: { publicCode: units[0].publicCode } });
  });

  it("rolls back batch and devices when audit log creation fails", async () => {
    const reference = `${referencePrefix}-ROLLBACK`;
    const units = unitsFor(reference, "rollback");

    await expectConfirmationCode(
      confirmSamplePreviewBatch({
        encodedUnits: encodeSampleUnits(units),
        actorUserId: crypto.randomUUID(),
        confirmedIrreversible: true,
        batchReference: reference,
      }),
      "DATABASE_CONSTRAINT_ERROR",
    );

    expect(await prisma.batch.count({ where: { internalReference: reference } })).toBe(0);
    expect(await prisma.device.count({ where: { publicCode: { in: units.map((unit) => unit.publicCode) } } })).toBe(0);
  });

  it("rejects invalid and expired previews before persisting anything", async () => {
    const invalidReference = `${referencePrefix}-INVALID`;
    await expectConfirmationCode(
      confirmSamplePreviewBatch({
        encodedUnits: "not-json",
        actorUserId,
        confirmedIrreversible: true,
        batchReference: invalidReference,
      }),
      "INVALID_PREVIEW",
    );
    expect(await prisma.batch.count({ where: { internalReference: invalidReference } })).toBe(0);

    const expiredReference = `${referencePrefix}-EXPIRED`;
    await expectConfirmationCode(
      confirmSamplePreviewBatch({
        encodedUnits: encodeSampleUnits(unitsFor(expiredReference, "expired"), { ttlMs: -1 }),
        actorUserId,
        confirmedIrreversible: true,
        batchReference: expiredReference,
      }),
      "PREVIEW_EXPIRED",
    );
    expect(await prisma.batch.count({ where: { internalReference: expiredReference } })).toBe(0);
  });

  it("handles double submit/concurrent confirmation atomically", async () => {
    const reference = `${referencePrefix}-CONCURRENT`;
    const encodedUnits = encodeSampleUnits(unitsFor(reference, "concurrent"));
    const attempts = await Promise.allSettled([
      confirmSamplePreviewBatch({ encodedUnits, actorUserId, confirmedIrreversible: true, batchReference: reference }),
      confirmSamplePreviewBatch({ encodedUnits, actorUserId, confirmedIrreversible: true, batchReference: reference }),
    ]);

    expect(attempts.filter((attempt) => attempt.status === "fulfilled")).toHaveLength(1);
    expect(attempts.filter((attempt) => attempt.status === "rejected")).toHaveLength(1);
    expect(await prisma.batch.count({ where: { internalReference: reference } })).toBe(1);
    const batch = await prisma.batch.findUniqueOrThrow({ where: { internalReference: reference } });
    expect(await prisma.device.count({ where: { batchId: batch.id } })).toBe(5);
    await cleanupReference(reference);
  });

  it("allows retry after a non-persisting preview error", async () => {
    const reference = `${referencePrefix}-RETRY`;
    await expectConfirmationCode(
      confirmSamplePreviewBatch({
        encodedUnits: "bad-preview",
        actorUserId,
        confirmedIrreversible: true,
        batchReference: reference,
      }),
      "INVALID_PREVIEW",
    );

    await confirmSamplePreviewBatch({
      encodedUnits: encodeSampleUnits(unitsFor(reference, "retry")),
      actorUserId,
      confirmedIrreversible: true,
      batchReference: reference,
    });

    expect(await prisma.batch.count({ where: { internalReference: reference } })).toBe(1);
    await cleanupReference(reference);
  });
});
