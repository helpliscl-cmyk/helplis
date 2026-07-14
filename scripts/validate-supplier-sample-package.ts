import { validateSupplierSamplePackage } from "@/server/operations/supplier-sample-package";

async function main() {
  const result = await validateSupplierSamplePackage({});
  console.log(
    JSON.stringify(
      {
        ok: true,
        folderPath: result.folderPath,
        zipPath: result.zipPath,
        publicCodes: result.publicCodes,
        files: result.files.length,
        checksumsValid: result.checksumsValid,
        qrValid: result.qrValid,
        secretsClean: result.secretsClean,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
