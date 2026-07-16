import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tx = {
    batch: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    device: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  };

  return {
    tx,
    prisma: {
      $transaction: vi.fn(async (callback: (txInput: unknown) => Promise<unknown>) => callback(tx)),
    },
  };
});

vi.mock("@/server/db/client", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/env/server", () => ({ env: { AUTH_SECRET: "test-auth-secret" } }));
vi.mock("@/lib/security/hashing", () => ({ hashActivationCode: vi.fn(async () => "hashed-activation") }));
vi.mock("@/server/operations/activation-code-vault", () => ({
  encryptActivationCode: vi.fn(() => "encrypted-activation"),
}));
vi.mock("@/server/services/codes", () => ({
  buildPublicUrl: (publicCode: string, baseUrl = "https://helplis.cl") => `${baseUrl.replace(/\/+$/, "")}/p/${publicCode}`,
  generateActivationCode: vi.fn(() => "INTERNALCODE99"),
  generatePublicCode: vi.fn(() => "ABCDEFGH"),
}));

function makeUnits() {
  const publicCodes = ["ABCDEFGH", "JKMNPQRS", "STUVWXYZ", "23456789", "BCDFGHJK"];
  return publicCodes.map((publicCode, index) => {
    const tagReference = `P-${String(index + 1).padStart(3, "0")}`;
    const publicUrl = `https://helplis.cl/p/${publicCode}`;
    return {
      tagReference,
      publicCode,
      publicUrl,
      qrUrl: publicUrl,
      nfcUrl: publicUrl,
      qrContent: publicUrl,
      nfcContent: publicUrl,
      qrFilename: `${tagReference}-${publicCode}.svg`,
      batchReference: "SAMPLE-HELPETS-001" as const,
      productLine: "HELPETS" as const,
      profileType: "PET" as const,
      deviceType: "PET_TAG" as const,
      productionMode: "SAMPLE" as const,
      initialState: "UNACTIVATED" as const,
      inventoryInitialState: "UNASSIGNED" as const,
    };
  });
}

describe("Helpets sample confirmation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.$transaction.mockImplementation(async (callback: (txInput: unknown) => Promise<unknown>) =>
      callback(mocks.tx),
    );
    mocks.tx.batch.findUnique.mockResolvedValue(null);
    mocks.tx.batch.create.mockResolvedValue({
      id: "batch_helpets",
      internalReference: "SAMPLE-HELPETS-001",
      quantity: 5,
      productionMode: "SAMPLE",
      productType: "PET_TAG",
    });
    mocks.tx.device.findMany.mockResolvedValue([]);
    mocks.tx.device.create.mockResolvedValue({ id: "device" });
    mocks.tx.auditLog.create.mockResolvedValue({ id: "audit" });
  });

  it("persists exactly the five preview candidates inside one transaction", async () => {
    const {
      confirmHelpetsSamplePreviewBatch,
      encodeHelpetsSampleUnits,
    } = await import("@/server/operations/helpets-sample");
    const units = makeUnits();
    const encodedUnits = encodeHelpetsSampleUnits(units);

    const batch = await confirmHelpetsSamplePreviewBatch({
      encodedUnits,
      actorUserId: "admin_1",
      confirmedIrreversible: true,
    });

    expect(batch.id).toBe("batch_helpets");
    expect(mocks.prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(mocks.tx.batch.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          internalReference: "SAMPLE-HELPETS-001",
          productType: "PET_TAG",
          productionMode: "SAMPLE",
          quantity: 5,
        }),
      }),
    );
    expect(mocks.tx.device.create).toHaveBeenCalledTimes(5);
    for (const [index, unit] of units.entries()) {
      expect(mocks.tx.device.create).toHaveBeenNthCalledWith(
        index + 1,
        expect.objectContaining({
          data: expect.objectContaining({
            internalSequence: index + 1,
            publicCode: unit.publicCode,
            publicUrl: unit.publicUrl,
            qrContent: unit.publicUrl,
            nfcContent: unit.publicUrl,
            productType: "PET_TAG",
            status: "UNASSIGNED",
            activationCodeHash: "hashed-activation",
          }),
        }),
      );
    }
    expect(mocks.tx.auditLog.create).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(mocks.tx.auditLog.create.mock.calls)).not.toMatch(/INTERNALCODE99|activationCode/);
  });

  it("blocks duplicate submit when the batch reference already exists", async () => {
    const {
      confirmHelpetsSamplePreviewBatch,
      encodeHelpetsSampleUnits,
      HelpetsSampleConfirmationError,
    } = await import("@/server/operations/helpets-sample");
    mocks.tx.batch.findUnique.mockResolvedValue({ id: "existing" });

    await expect(
      confirmHelpetsSamplePreviewBatch({
        encodedUnits: encodeHelpetsSampleUnits(makeUnits()),
        actorUserId: "admin_1",
        confirmedIrreversible: true,
      }),
    ).rejects.toMatchObject({
      code: "BATCH_REFERENCE_ALREADY_EXISTS",
      name: HelpetsSampleConfirmationError.name,
    });
    expect(mocks.tx.device.create).not.toHaveBeenCalled();
  });

  it("blocks publicCode collisions before creating devices", async () => {
    const { confirmHelpetsSamplePreviewBatch, encodeHelpetsSampleUnits } = await import(
      "@/server/operations/helpets-sample"
    );
    mocks.tx.device.findMany.mockResolvedValue([{ publicCode: "ABCDEFGH" }]);

    await expect(
      confirmHelpetsSamplePreviewBatch({
        encodedUnits: encodeHelpetsSampleUnits(makeUnits()),
        actorUserId: "admin_1",
        confirmedIrreversible: true,
      }),
    ).rejects.toMatchObject({ code: "PUBLIC_CODE_COLLISION" });
    expect(mocks.tx.device.create).not.toHaveBeenCalled();
  });

  it("rejects invalid previews and requires irreversible confirmation", async () => {
    const { confirmHelpetsSamplePreviewBatch, encodeHelpetsSampleUnits } = await import(
      "@/server/operations/helpets-sample"
    );

    await expect(
      confirmHelpetsSamplePreviewBatch({
        encodedUnits: "",
        actorUserId: "admin_1",
        confirmedIrreversible: true,
      }),
    ).rejects.toMatchObject({ code: "INVALID_PREVIEW" });

    await expect(
      confirmHelpetsSamplePreviewBatch({
        encodedUnits: encodeHelpetsSampleUnits(makeUnits()),
        actorUserId: "admin_1",
        confirmedIrreversible: false,
      }),
    ).rejects.toMatchObject({ code: "INVALID_PREVIEW" });
  });

  it("does not write an audit log when a device create fails inside the transaction", async () => {
    const { confirmHelpetsSamplePreviewBatch, encodeHelpetsSampleUnits } = await import(
      "@/server/operations/helpets-sample"
    );
    mocks.tx.device.create.mockImplementation(async () => {
      if (mocks.tx.device.create.mock.calls.length === 3) throw new Error("controlled failure");
      return { id: "device" };
    });

    await expect(
      confirmHelpetsSamplePreviewBatch({
        encodedUnits: encodeHelpetsSampleUnits(makeUnits()),
        actorUserId: "admin_1",
        confirmedIrreversible: true,
      }),
    ).rejects.toMatchObject({ code: "UNKNOWN_CONFIRMATION_ERROR" });

    expect(mocks.prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(mocks.tx.auditLog.create).not.toHaveBeenCalled();
  });
});
