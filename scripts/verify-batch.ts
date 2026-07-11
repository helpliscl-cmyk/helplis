import { PrismaClient } from "@prisma/client";
import { isAllowedPublicUrl } from "../server/services/codes";

const prisma = new PrismaClient();

async function main() {
  const devices = await prisma.device.findMany({
    where: process.argv[2] ? { batch: { internalReference: process.argv[2] } } : undefined,
  });
  const errors: string[] = [];
  const codes = new Set<string>();
  const uids = new Set<string>();

  for (const device of devices) {
    if (codes.has(device.publicCode)) errors.push(`publicCode duplicado ${device.publicCode}`);
    codes.add(device.publicCode);
    if (!isAllowedPublicUrl(device.publicUrl)) errors.push(`URL inválida ${device.publicUrl}`);
    if (device.nfcUid) {
      if (uids.has(device.nfcUid)) errors.push(`UID duplicado ${device.nfcUid}`);
      uids.add(device.nfcUid);
    }
    if (!device.activationCodeHash.startsWith("$2")) errors.push(`activationCodeHash inválido ${device.publicCode}`);
  }

  if (errors.length) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
  console.log(`Verificados ${devices.length} dispositivos sin errores.`);
}

main().finally(async () => prisma.$disconnect());
