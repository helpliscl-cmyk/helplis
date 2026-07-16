import { prepareHelpetsSamplePackages } from "@/server/operations/helpets-sample";

async function main() {
  const result = await prepareHelpetsSamplePackages();
  console.log(
    JSON.stringify(
      {
        ok: true,
        persisted: false,
        simpleDirectory: result.simpleDirectory,
        internalDirectory: result.internalDirectory,
        simpleZipPath: result.simpleZipPath,
        internalZipPath: result.internalZipPath,
        publicCodes: result.units.map((unit) => unit.publicCode),
        publicUrls: result.units.map((unit) => unit.publicUrl),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
