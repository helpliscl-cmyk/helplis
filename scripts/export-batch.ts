import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const batchReference = process.argv[2];
  const batch = batchReference
    ? await prisma.batch.findFirst({ where: { internalReference: batchReference } })
    : await prisma.batch.findFirst({ orderBy: { createdAt: "desc" } });
  if (!batch) throw new Error("No hay lote para exportar.");

  const devices = await prisma.device.findMany({
    where: { batchId: batch.id },
    orderBy: { publicCode: "asc" },
  });
  console.log("publicCode,publicUrl,nfcUid,productType,status");
  for (const device of devices) {
    console.log([device.publicCode, device.publicUrl, device.nfcUid ?? "", device.productType, device.status].join(","));
  }
}

main().finally(async () => prisma.$disconnect());
