import { PrismaClient } from "@prisma/client";
import { recordPhysicalVerification } from "../server/operations/physical-verification";

const prisma = new PrismaClient();

async function main() {
  const reference = process.argv[2];
  const mode = process.argv[3] ?? "summary";
  if (!reference) throw new Error("Uso: npm run production:verify -- BATCH_REFERENCE [mark-ok]");

  const batch = await prisma.batch.findFirst({
    where: { internalReference: reference },
    include: { devices: { orderBy: { internalSequence: "asc" } } },
  });
  if (!batch) throw new Error(`No existe lote ${reference}.`);

  if (mode === "mark-ok") {
    for (const device of batch.devices) {
      await recordPhysicalVerification({
        batchId: batch.id,
        publicCode: device.publicCode,
        qrObserved: device.publicUrl,
        nfcObserved: device.publicUrl,
        nfcUidObserved: device.nfcUid ?? undefined,
        notes: "Verificacion automatica CLI para lote demo/controlado.",
      });
    }
  }

  const counts = await prisma.device.groupBy({
    by: ["verificationStatus"],
    where: { batchId: batch.id },
    _count: true,
  });
  console.log(JSON.stringify({ batch: batch.internalReference, counts }, null, 2));
}

main().finally(async () => prisma.$disconnect());
