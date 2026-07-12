import { PrismaClient, ProductType, ProductionMode } from "@prisma/client";
import { generateProductionCodesForBatch } from "../server/operations/production-codes";

const prisma = new PrismaClient();

async function main() {
  const quantity = Number(process.argv[2] ?? 5);
  const internalReference = process.argv[3] ?? "SAMPLE-DEMO-001";
  const productionMode = (process.argv[4] ?? "DEMO") as ProductionMode;
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 500) {
    throw new Error("Cantidad invalida. Usa 1 a 500.");
  }

  const batch = await prisma.batch.create({
    data: {
      internalReference,
      supplierName: "Proveedor demo",
      productType: ProductType.WRISTBAND,
      productModel: "Pulsera silicona ajustable",
      chipType: "NTAG213",
      domain: "https://helplis.cl",
      quantity,
      productionMode,
      status: "DRAFT",
      notes: "Lote generado por npm run production:generate. No enviar al proveedor sin revision.",
    },
  });

  await generateProductionCodesForBatch(batch.id);
  console.log(`Lote ${batch.internalReference} creado con ${quantity} codigos.`);
  console.log("Los activationCode quedaron cifrados y hasheados; no se imprimen en consola.");
}

main().finally(async () => prisma.$disconnect());
