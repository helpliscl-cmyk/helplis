import { ProductType } from "@prisma/client";
import { prisma } from "@/server/db/client";

export class PhysicalUidCaptureError extends Error {
  constructor(
    public readonly code: "BATCH_NOT_FOUND" | "DEVICE_NOT_FOUND" | "INVALID_UID" | "UID_ALREADY_ASSIGNED",
    message: string,
  ) {
    super(message);
    this.name = "PhysicalUidCaptureError";
  }
}

function normalizeUid(value: string) {
  return value.trim().toUpperCase().replace(/[^A-F0-9]/g, "");
}

export async function capturePhysicalNfcUid(input: {
  batchId: string;
  publicCode: string;
  nfcUid: string;
  actorUserId?: string;
}) {
  const publicCode = input.publicCode.trim().toUpperCase();
  const nfcUid = normalizeUid(input.nfcUid);

  if (!/^[A-F0-9]{6,32}$/.test(nfcUid)) {
    throw new PhysicalUidCaptureError("INVALID_UID", "NFC UID must be hexadecimal and between 6 and 32 chars.");
  }

  return prisma.$transaction(async (tx) => {
    const batch = await tx.batch.findUnique({
      where: { id: input.batchId },
      select: { id: true, internalReference: true, productType: true, status: true },
    });
    if (!batch || batch.productType !== ProductType.PET_TAG) {
      throw new PhysicalUidCaptureError("BATCH_NOT_FOUND", "Helpets PET_TAG batch not found.");
    }

    const device = await tx.device.findFirst({
      where: { batchId: input.batchId, publicCode },
      select: {
        id: true,
        publicCode: true,
        publicUrl: true,
        qrContent: true,
        nfcContent: true,
        nfcUid: true,
        verificationStatus: true,
      },
    });
    if (!device) {
      throw new PhysicalUidCaptureError("DEVICE_NOT_FOUND", "Device not found in Helpets batch.");
    }

    const duplicate = await tx.device.findFirst({
      where: { nfcUid, id: { not: device.id } },
      select: { id: true, publicCode: true },
    });
    if (duplicate) {
      throw new PhysicalUidCaptureError("UID_ALREADY_ASSIGNED", "NFC UID is already assigned to another device.");
    }

    const qrExpected = device.qrContent ?? device.publicUrl;
    const nfcExpected = device.nfcContent ?? device.publicUrl;

    await tx.device.update({
      where: { id: device.id },
      data: {
        nfcUid,
        verificationStatus: "UID_VERIFIED",
        inventoryStatus: "PENDING_VERIFICATION",
      },
    });

    const verification = await tx.physicalVerification.create({
      data: {
        deviceId: device.id,
        batchId: input.batchId,
        qrExpected,
        nfcExpected,
        nfcUidExpected: nfcUid,
        nfcUidObserved: nfcUid,
        qrStatus: "PENDING",
        nfcStatus: "PENDING",
        uidStatus: "UID_VERIFIED",
        physicalStatus: "PENDING",
        overallStatus: "UID_VERIFIED",
        notes: "UID captured after receiving physical Helpets tag.",
        verifiedBy: input.actorUserId,
        verifiedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        action: "HELPETS_PHYSICAL_UID_CAPTURED",
        entityType: "Device",
        entityId: device.id,
        newData: JSON.stringify({
          batchId: input.batchId,
          batchReference: batch.internalReference,
          publicCode: device.publicCode,
          nfcUidCaptured: true,
          verificationId: verification.id,
        }),
      },
    });

    return verification;
  });
}
