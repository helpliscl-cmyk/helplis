import { prepareSupplierSamplePackageFromDatabase } from "@/server/operations/supplier-sample-package";

async function main() {
  const result = await prepareSupplierSamplePackageFromDatabase({ recordProductionFile: false });
  console.log(
    JSON.stringify(
      {
        ok: true,
        folderPath: result.folderPath,
        zipPath: result.zipPath,
        zipChecksum: result.zipChecksum,
        zipSizeBytes: result.zipSizeBytes,
        publicCodes: result.units.map((unit) => unit.publicCode),
        files: result.files,
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
