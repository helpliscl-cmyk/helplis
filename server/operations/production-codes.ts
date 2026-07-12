import { DeviceStatus, type ProductType } from "@prisma/client";
import { hashActivationCode } from "@/lib/security/hashing";
import { prisma } from "@/server/db/client";
import { buildPublicUrl, generateActivationCode, generateUniquePublicCode } from "@/server/services/codes";
import { encryptActivationCode } from "./activation-code-vault";

export type GeneratedProductionCode = {
  internalSequence: number;
  publicCode: string;
  publicUrl: string;
  qrContent: string;
  nfcContent: string;
  activationCode: string;
};

export async function generateProductionCodesForBatch(batchId: string, actorUserId?: string) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: { _count: { select: { devices: true } } },
  });
  if (!batch) throw new Error("Batch not found.");
  if (batch._count.devices > 0) throw new Error("Batch already has generated codes.");

  const generated: GeneratedProductionCode[] = [];
  for (let index = 0; index < batch.quantity; index += 1) {
    const publicCode = await generateUniquePublicCode(async (code) => {
      const existing = await prisma.device.findUnique({ where: { publicCode: code } });
      return Boolean(existing);
    });
    const publicUrl = buildPublicUrl(publicCode, batch.domain);
    generated.push({
      internalSequence: index + 1,
      publicCode,
      publicUrl,
      qrContent: publicUrl,
      nfcContent: publicUrl,
      activationCode: generateActivationCode(14),
    });
  }

  await prisma.$transaction(async (tx) => {
    for (const unit of generated) {
      await tx.device.create({
        data: {
          internalSequence: unit.internalSequence,
          publicCode: unit.publicCode,
          publicUrl: unit.publicUrl,
          qrContent: unit.qrContent,
          nfcContent: unit.nfcContent,
          activationCodeHash: await hashActivationCode(unit.activationCode),
          activationCodeEncrypted: encryptActivationCode(unit.activationCode),
          batchId: batch.id,
          productType: batch.productType as ProductType,
          status: DeviceStatus.UNASSIGNED,
          productionStatus: "CODES_GENERATED",
          verificationStatus: "PENDING",
          inventoryStatus: "IN_PRODUCTION",
        },
      });
    }

    await tx.batch.update({
      where: { id: batch.id },
      data: { status: "CODES_GENERATED" },
    });

    await tx.auditLog.create({
      data: {
        actorUserId,
        action: "PRODUCTION_CODES_GENERATED",
        entityType: "Batch",
        entityId: batch.id,
        newData: JSON.stringify({
          internalReference: batch.internalReference,
          quantity: batch.quantity,
          productionMode: batch.productionMode,
        }),
      },
    });
  });

  return generated;
}
