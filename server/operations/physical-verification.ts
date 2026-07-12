import { prisma } from "@/server/db/client";
import { escapeCsvCell } from "@/server/operations/manufacturer-export";

export type PhysicalVerificationInput = {
  batchId: string;
  publicCode: string;
  qrObserved?: string;
  nfcObserved?: string;
  nfcUidObserved?: string;
  damaged?: boolean;
  missing?: boolean;
  notes?: string;
  photoUrl?: string;
  verifiedBy?: string;
};

function compareUrl(observed: string | undefined, expected: string) {
  if (!observed) return "PENDING";
  return observed.trim() === expected ? "QR_VERIFIED" : "QR_MISMATCH";
}

function compareNfcUrl(observed: string | undefined, expected: string) {
  if (!observed) return "PENDING";
  return observed.trim() === expected ? "NFC_VERIFIED" : "NFC_MISMATCH";
}

function compareUid(observed: string | undefined, expected: string | null) {
  const normalizedObserved = observed?.trim().toUpperCase().replace(/\s+/g, "") || "";
  if (!normalizedObserved && !expected) return "PENDING";
  if (!expected) return normalizedObserved ? "UID_VERIFIED" : "PENDING";
  return normalizedObserved === expected ? "UID_VERIFIED" : "UID_MISMATCH";
}

function overallStatus(input: {
  damaged?: boolean;
  missing?: boolean;
  qrStatus: string;
  nfcStatus: string;
  uidStatus: string;
  expectedUid: string | null;
}) {
  if (input.missing) return "MISSING";
  if (input.damaged) return "DAMAGED";
  if (input.qrStatus === "QR_MISMATCH") return "QR_MISMATCH";
  if (input.nfcStatus === "NFC_MISMATCH") return "NFC_MISMATCH";
  if (input.uidStatus === "UID_MISMATCH") return "UID_MISMATCH";
  const uidOk = input.uidStatus === "UID_VERIFIED";
  if (input.qrStatus === "QR_VERIFIED" && input.nfcStatus === "NFC_VERIFIED" && uidOk) return "FULLY_VERIFIED";
  return "PENDING";
}

export async function recordPhysicalVerification(input: PhysicalVerificationInput) {
  const publicCode = input.publicCode.trim().toUpperCase();
  const device = await prisma.device.findFirst({
    where: { batchId: input.batchId, publicCode },
  });
  if (!device) throw new Error("Device not found in batch.");

  const qrExpected = device.qrContent ?? device.publicUrl;
  const nfcExpected = device.nfcContent ?? device.publicUrl;
  const normalizedUid = input.nfcUidObserved?.trim().toUpperCase().replace(/\s+/g, "") || null;
  const qrStatus = compareUrl(input.qrObserved, qrExpected);
  const nfcStatus = compareNfcUrl(input.nfcObserved, nfcExpected);
  const uidStatus = compareUid(normalizedUid ?? undefined, device.nfcUid);
  const physicalStatus = input.missing ? "MISSING" : input.damaged ? "DAMAGED" : "PENDING";
  const overall = overallStatus({
    damaged: input.damaged,
    missing: input.missing,
    qrStatus,
    nfcStatus,
    uidStatus,
    expectedUid: device.nfcUid,
  });

  const verification = await prisma.physicalVerification.create({
    data: {
      deviceId: device.id,
      batchId: input.batchId,
      qrExpected,
      qrObserved: input.qrObserved?.trim() || null,
      nfcExpected,
      nfcObserved: input.nfcObserved?.trim() || null,
      nfcUidExpected: device.nfcUid,
      nfcUidObserved: normalizedUid,
      qrStatus,
      nfcStatus,
      uidStatus,
      physicalStatus,
      overallStatus: overall,
      notes: input.notes?.trim() || null,
      photoUrl: input.photoUrl?.trim() || null,
      verifiedBy: input.verifiedBy,
      verifiedAt: new Date(),
    },
  });

  await prisma.device.update({
    where: { id: device.id },
    data: {
      verificationStatus: overall,
      inventoryStatus:
        overall === "FULLY_VERIFIED"
          ? "AVAILABLE"
          : overall === "DAMAGED"
            ? "DAMAGED"
            : overall === "MISSING"
              ? "LOST"
              : "PENDING_VERIFICATION",
      productionStatus: overall === "FULLY_VERIFIED" ? "VERIFIED" : device.productionStatus,
    },
  });

  const verifiedCount = await prisma.device.count({
    where: { batchId: input.batchId, verificationStatus: "FULLY_VERIFIED" },
  });
  const batch = await prisma.batch.findUnique({ where: { id: input.batchId } });
  await prisma.batch.update({
    where: { id: input.batchId },
    data: {
      verifiedAt: batch && verifiedCount >= batch.quantity ? new Date() : undefined,
      status: batch && verifiedCount >= batch.quantity ? "VERIFIED" : "VERIFICATION_IN_PROGRESS",
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: input.verifiedBy,
      action: "PHYSICAL_VERIFICATION_RECORDED",
      entityType: "PhysicalVerification",
      entityId: verification.id,
      newData: JSON.stringify({
        batchId: input.batchId,
        publicCode,
        overall,
        qrStatus,
        nfcStatus,
        uidStatus,
      }),
    },
  });

  return verification;
}

export async function verificationReportCsv(batchId: string) {
  const rows = await prisma.physicalVerification.findMany({
    where: { batchId },
    include: { device: { select: { publicCode: true, publicUrl: true, nfcUid: true } } },
    orderBy: { createdAt: "desc" },
  });
  const header = [
    "public_code",
    "public_url",
    "nfc_uid_expected",
    "qr_status",
    "nfc_status",
    "uid_status",
    "physical_status",
    "overall_status",
    "notes",
    "verified_at",
  ];
  return [
    header.join(","),
    ...rows.map((row) =>
      [
        row.device.publicCode,
        row.device.publicUrl,
        row.nfcUidExpected ?? "",
        row.qrStatus,
        row.nfcStatus,
        row.uidStatus,
        row.physicalStatus,
        row.overallStatus,
        row.notes ?? "",
        row.verifiedAt?.toISOString() ?? "",
      ]
        .map(escapeCsvCell)
        .join(","),
    ),
  ].join("\n");
}
