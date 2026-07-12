import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { importSupplierUidReturn } from "../server/operations/supplier-uid-import";

const prisma = new PrismaClient();

async function main() {
  const reference = process.argv[2];
  const filename = process.argv[3];
  const mode = process.argv[4] ?? "dry-run";
  if (!reference || !filename) {
    throw new Error("Uso: npm run production:import-uid -- BATCH_REFERENCE archivo.csv [import]");
  }

  const batch = await prisma.batch.findFirst({ where: { internalReference: reference } });
  if (!batch) throw new Error(`No existe lote ${reference}.`);

  const job = await importSupplierUidReturn({
    batchId: batch.id,
    filename,
    buffer: readFileSync(filename),
    dryRun: mode !== "import",
  });
  console.log(`Importacion ${job.id}: ${job.status}`);
  console.log(`${job.validRows} validas, ${job.invalidRows} invalidas, ${job.importedRows} importadas.`);
}

main().finally(async () => prisma.$disconnect());
