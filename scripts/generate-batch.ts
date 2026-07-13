import { ProductType, PrismaClient } from "@prisma/client";
import { hashActivationCode } from "../lib/security/hashing";
import { buildPublicUrl, generateActivationCode, generateUniquePublicCode } from "../server/services/codes";

const prisma = new PrismaClient();

async function main() {
  const quantity = Number(process.argv[2] ?? 10);
  const productType = (process.argv[3] ?? "WRISTBAND") as ProductType;
  const batch = await prisma.batch.create({
    data: {
      supplierName: "CLI local",
      internalReference: `HLP-CLI-${Date.now()}`,
      quantity,
      receivedQuantity: quantity,
      status: "GENERATED",
      notes: "Generado por npm run generate:batch",
    },
  });

  const exportRows = ["publicCode,publicUrl,activationCode,productType"];
  for (let index = 0; index < quantity; index += 1) {
    const publicCode = await generateUniquePublicCode(async (code) =>
      Boolean(await prisma.device.findUnique({ where: { publicCode: code } })),
    );
    const activationCode = generateActivationCode();
    const publicUrl = buildPublicUrl(publicCode);
    await prisma.device.create({
      data: {
        publicCode,
        publicUrl,
        qrContent: publicUrl,
        nfcContent: publicUrl,
        activationCodeHash: await hashActivationCode(activationCode),
        batchId: batch.id,
        productType,
        status: "AVAILABLE",
      },
    });
    exportRows.push(`${publicCode},${publicUrl},${activationCode},${productType}`);
  }

  console.log(`Lote ${batch.internalReference} generado.`);
  console.log(exportRows.join("\n"));
}

main().finally(async () => prisma.$disconnect());
