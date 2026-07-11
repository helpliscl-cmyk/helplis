import { readFileSync } from "node:fs";
import { ProductType, PrismaClient } from "@prisma/client";
import { hashActivationCode } from "../lib/security/hashing";
import { buildPublicUrl, generateActivationCode } from "../server/services/codes";

const prisma = new PrismaClient();

async function main() {
  const file = process.argv[2] ?? "data/example-import.csv";
  const csv = readFileSync(file, "utf8");
  const rows = csv.split(/\r?\n/).map((row) => row.trim()).filter(Boolean);
  const job = await prisma.importJob.create({
    data: { filename: file, totalRows: rows.length, status: "VALIDATED" },
  });

  let validRows = 0;
  let invalidRows = 0;
  for (const [index, row] of rows.entries()) {
    const [publicCodeRaw, publicUrl, nfcUid, productTypeRaw] = row.split(",").map((part) => part.trim());
    const publicCode = publicCodeRaw.toUpperCase();
    const errors: string[] = [];
    if (publicUrl !== buildPublicUrl(publicCode)) errors.push("URL no coincide");
    if (await prisma.device.findUnique({ where: { publicCode } })) errors.push("publicCode duplicado");
    if (nfcUid && (await prisma.device.findUnique({ where: { nfcUid } }))) errors.push("UID NFC duplicado");
    const productType = Object.values(ProductType).includes(productTypeRaw as ProductType)
      ? (productTypeRaw as ProductType)
      : ProductType.WRISTBAND;

    const isValid = errors.length === 0;
    validRows += isValid ? 1 : 0;
    invalidRows += isValid ? 0 : 1;

    await prisma.importRow.create({
      data: {
        importJobId: job.id,
        rowNumber: index + 1,
        publicCode,
        publicUrl,
        nfcUid,
        productType,
        isValid,
        errors: errors.length ? JSON.stringify(errors) : null,
        rawData: row,
      },
    });

    if (isValid) {
      await prisma.device.create({
        data: {
          publicCode,
          publicUrl,
          nfcUid,
          productType,
          status: "AVAILABLE",
          activationCodeHash: await hashActivationCode(generateActivationCode()),
        },
      });
    }
  }

  await prisma.importJob.update({
    where: { id: job.id },
    data: { validRows, invalidRows, status: invalidRows ? "VALIDATED" : "IMPORTED" },
  });

  console.log(`Importación ${job.id}: ${validRows} válidas, ${invalidRows} inválidas.`);
}

main().finally(async () => prisma.$disconnect());
