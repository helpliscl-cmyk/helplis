import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tx = {
    batch: {
      findUnique: vi.fn(),
    },
    device: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    physicalVerification: {
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

describe("physical UID capture", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.$transaction.mockImplementation(async (callback: (txInput: unknown) => Promise<unknown>) =>
      callback(mocks.tx),
    );
    mocks.tx.batch.findUnique.mockResolvedValue({
      id: "batch_helpets",
      internalReference: "SAMPLE-HELPETS-001",
      productType: "PET_TAG",
      status: "AWAITING_QUOTE",
    });
    mocks.tx.device.findFirst
      .mockResolvedValueOnce({
        id: "device_1",
        publicCode: "ABCDEFGH",
        publicUrl: "https://helplis.cl/p/ABCDEFGH",
        qrContent: "https://helplis.cl/p/ABCDEFGH",
        nfcContent: "https://helplis.cl/p/ABCDEFGH",
        nfcUid: null,
        verificationStatus: "PENDING",
      })
      .mockResolvedValueOnce(null);
    mocks.tx.device.update.mockResolvedValue({ id: "device_1" });
    mocks.tx.physicalVerification.create.mockResolvedValue({ id: "verification_1" });
    mocks.tx.auditLog.create.mockResolvedValue({ id: "audit_1" });
  });

  it("records a physical UID for the selected Helpets tag", async () => {
    const { capturePhysicalNfcUid } = await import("@/server/operations/physical-uid-capture");

    await capturePhysicalNfcUid({
      batchId: "batch_helpets",
      publicCode: "ABCDEFGH",
      nfcUid: "04 a1 b2 c3 d4",
      actorUserId: "admin_1",
    });

    expect(mocks.tx.device.update).toHaveBeenCalledWith({
      where: { id: "device_1" },
      data: {
        nfcUid: "04A1B2C3D4",
        verificationStatus: "UID_VERIFIED",
        inventoryStatus: "PENDING_VERIFICATION",
      },
    });
    expect(mocks.tx.physicalVerification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          nfcUidExpected: "04A1B2C3D4",
          nfcUidObserved: "04A1B2C3D4",
          uidStatus: "UID_VERIFIED",
          overallStatus: "UID_VERIFIED",
        }),
      }),
    );
    expect(mocks.tx.auditLog.create).toHaveBeenCalledTimes(1);
  });

  it("blocks duplicated NFC UIDs", async () => {
    const { capturePhysicalNfcUid } = await import("@/server/operations/physical-uid-capture");
    mocks.tx.device.findFirst
      .mockReset()
      .mockResolvedValueOnce({
        id: "device_1",
        publicCode: "ABCDEFGH",
        publicUrl: "https://helplis.cl/p/ABCDEFGH",
        qrContent: "https://helplis.cl/p/ABCDEFGH",
        nfcContent: "https://helplis.cl/p/ABCDEFGH",
        nfcUid: null,
        verificationStatus: "PENDING",
      })
      .mockResolvedValueOnce({ id: "device_2", publicCode: "JKLMNPQR" });

    await expect(
      capturePhysicalNfcUid({
        batchId: "batch_helpets",
        publicCode: "ABCDEFGH",
        nfcUid: "04A1B2C3D4",
        actorUserId: "admin_1",
      }),
    ).rejects.toMatchObject({ code: "UID_ALREADY_ASSIGNED" });

    expect(mocks.tx.device.update).not.toHaveBeenCalled();
    expect(mocks.tx.physicalVerification.create).not.toHaveBeenCalled();
    expect(mocks.tx.auditLog.create).not.toHaveBeenCalled();
  });
});
