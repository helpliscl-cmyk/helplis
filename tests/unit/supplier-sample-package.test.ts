import { readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";
import { PNG } from "pngjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sha256 } from "@/server/operations/manufacturer-export";

vi.mock("@/server/db/client", () => ({
  prisma: new Proxy(
    {},
    {
      get() {
        throw new Error("Prisma must not be used by local supplier package builds.");
      },
    },
  ),
}));

const outputRoot = path.join(process.cwd(), "exports", "__test-supplier-sample");
const zipPath = path.join(process.cwd(), "exports", "__test-supplier-sample.zip");

const expectedCodes = ["SJRUPNZQ", "BCM3BLAJ", "H26EJYQW", "THAHHRYR", "TCR6MTJB"] as const;
const expectedFiles = [
  "00-README-FIRST.txt",
  "01-production-data.xlsx",
  "02-production-data.csv",
  "03-manufacturing-instructions-en.pdf",
  "04-manufacturing-instructions-en.txt",
  "05-supplier-return-template.xlsx",
  "06-checksums-sha256.txt",
  "branding/README-branding.txt",
  "branding/helplis-logo-vector.pdf",
  "branding/helplis-logo-vector.svg",
  "branding/layout-reference.png",
  ...expectedCodes.map((code) => `qr-png/${code}.png`),
  ...expectedCodes.map((code) => `qr-svg/${code}.svg`),
].sort();

function sampleUnits() {
  return expectedCodes.map((publicCode, index) => {
    const publicUrl = `https://helplis.cl/p/${publicCode}`;
    return {
      wristbandReference: `W-${String(index + 1).padStart(3, "0")}`,
      publicCode,
      publicUrl,
      qrContent: publicUrl,
      nfcContent: publicUrl,
      qrPngFilename: `${publicCode}.png`,
      qrSvgFilename: `${publicCode}.svg`,
      batchReference: "SAMPLE-HELPLIS-001",
    };
  });
}

async function workbookRows(buffer: Buffer, sheetIndex: number) {
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.file(`xl/worksheets/sheet${sheetIndex}.xml`)?.async("string");
  expect(xml).toBeTruthy();
  return [...xml!.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map((rowMatch) =>
    [...rowMatch[1].matchAll(/<t>([\s\S]*?)<\/t>/g)].map((cellMatch) =>
      cellMatch[1]
        .replaceAll("&quot;", '"')
        .replaceAll("&apos;", "'")
        .replaceAll("&gt;", ">")
        .replaceAll("&lt;", "<")
        .replaceAll("&amp;", "&"),
    ),
  );
}

describe("final supplier SAMPLE package", () => {
  beforeEach(async () => {
    await rm(outputRoot, { recursive: true, force: true });
    await rm(zipPath, { force: true });
  });

  afterEach(async () => {
    await rm(outputRoot, { recursive: true, force: true });
    await rm(zipPath, { force: true });
  });

  it("builds and validates the exact local supplier package without database writes", async () => {
    const {
      buildSupplierSamplePackage,
      decodeQrPng,
      validateSupplierSamplePackage,
      SUPPLIER_SAMPLE_EXPORT_NAME,
    } = await import("@/server/operations/supplier-sample-package");

    const result = await buildSupplierSamplePackage({ units: sampleUnits(), outputRoot, zipPath });
    const validation = await validateSupplierSamplePackage({ folderPath: outputRoot, zipPath, expectedUnits: sampleUnits() });

    expect(result.files).toEqual(expectedFiles);
    expect(validation.publicCodes).toEqual([...expectedCodes]);
    expect(validation.checksumsValid).toBe(true);
    expect(validation.qrValid).toBe(true);
    expect(validation.secretsClean).toBe(true);

    const csv = await readFile(path.join(outputRoot, "02-production-data.csv"), "utf8");
    expect(csv.trim().split(/\r?\n/)).toHaveLength(6);
    expect(csv).not.toMatch(/activationCode|activationCodeHash|DATABASE_URL|DIRECT_URL|SUPABASE_SERVICE_ROLE_KEY/i);
    for (const code of expectedCodes) {
      expect(csv).toContain(`https://helplis.cl/p/${code}`);
    }

    const productionWorkbookRows = await workbookRows(await readFile(path.join(outputRoot, "01-production-data.xlsx")), 1);
    expect(productionWorkbookRows).toHaveLength(6);
    expect(productionWorkbookRows[0]).toEqual([
      "Wristband Reference",
      "Public Code",
      "Public URL",
      "QR Content",
      "NFC Content",
      "QR PNG Filename",
      "QR SVG Filename",
      "Batch Reference",
    ]);
    expect(productionWorkbookRows.slice(1).map((row) => row[0])).toEqual(["W-001", "W-002", "W-003", "W-004", "W-005"]);

    const supplierReturnRows = await workbookRows(await readFile(path.join(outputRoot, "05-supplier-return-template.xlsx")), 1);
    expect(supplierReturnRows).toHaveLength(6);
    expect(supplierReturnRows.slice(1).every((row) => row.slice(3).every((cell) => cell === ""))).toBe(true);
    expect(JSON.stringify(supplierReturnRows)).not.toMatch(/fake|dummy|uid-[0-9]/i);

    for (const code of expectedCodes) {
      const pngPath = path.join(outputRoot, "qr-png", `${code}.png`);
      const pngBuffer = await readFile(pngPath);
      const png = PNG.sync.read(pngBuffer);
      expect(png.width).toBeGreaterThanOrEqual(1200);
      expect(png.height).toBeGreaterThanOrEqual(1200);
      expect(await decodeQrPng(pngBuffer)).toBe(`https://helplis.cl/p/${code}`);

      const svg = await readFile(path.join(outputRoot, "qr-svg", `${code}.svg`), "utf8");
      expect(svg).toContain("<svg");
      expect(svg).not.toMatch(/<script|href=["']https?:/i);
    }

    await expect(stat(path.join(outputRoot, "branding", "helplis-logo-vector.pdf"))).resolves.toBeTruthy();
    await expect(stat(path.join(outputRoot, "branding", "helplis-logo-vector.svg"))).resolves.toBeTruthy();
    await expect(stat(path.join(outputRoot, "branding", "layout-reference.png"))).resolves.toBeTruthy();
    expect(await readFile(path.join(outputRoot, "04-manufacturing-instructions-en.txt"), "utf8")).toContain(
      "HelPlis - Five Functional NFC Wristband Samples",
    );

    const zip = await JSZip.loadAsync(await readFile(zipPath));
    const zipFiles = Object.values(zip.files)
      .filter((entry) => !entry.dir)
      .map((entry) => entry.name)
      .sort();
    expect(zipFiles).toEqual(expectedFiles.map((file) => `${SUPPLIER_SAMPLE_EXPORT_NAME}/${file}`).sort());
  }, 30_000);

  it("regenerates an identical zip while the persisted unit data is unchanged", async () => {
    const { buildSupplierSamplePackage } = await import("@/server/operations/supplier-sample-package");

    await buildSupplierSamplePackage({ units: sampleUnits(), outputRoot, zipPath });
    const first = sha256(await readFile(zipPath));
    await buildSupplierSamplePackage({ units: sampleUnits(), outputRoot, zipPath });
    const second = sha256(await readFile(zipPath));

    expect(second).toBe(first);
  }, 30_000);

  it("keeps the admin action protected and tied to the confirmed SAMPLE batch", async () => {
    const actionSource = await readFile(
      path.join(process.cwd(), "features", "production", "supplier-sample-actions.ts"),
      "utf8",
    );

    expect(actionSource).toContain("export async function prepareSupplierSamplePackageAction");
    expect(actionSource).toContain("requireRole([...adminRoles])");
    expect(actionSource).toContain("assertProductionWriteSafety(user)");
    expect(actionSource).toContain("recordProductionFile: true");
    expect(actionSource).toContain("SAMPLE_BATCH_REFERENCE");
  });
});
