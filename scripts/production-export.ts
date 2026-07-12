import { PrismaClient } from "@prisma/client";
import { generateManufacturerExportPackage, type ManufacturerExportFormat } from "../server/operations/manufacturer-export";

const prisma = new PrismaClient();

async function main() {
  const reference = process.argv[2];
  const format = (process.argv[3] ?? "FULL_PACKAGE") as ManufacturerExportFormat;
  const batch = reference
    ? await prisma.batch.findFirst({ where: { internalReference: reference } })
    : await prisma.batch.findFirst({ orderBy: { createdAt: "desc" } });
  if (!batch) throw new Error("No hay lote para exportar.");

  const file = await generateManufacturerExportPackage({ batchId: batch.id, format });
  console.log(`Archivo generado: ${file.filename}`);
  console.log(`Ruta: ${file.storagePath}`);
  console.log(`Checksum: ${file.checksum}`);
}

main().finally(async () => prisma.$disconnect());
