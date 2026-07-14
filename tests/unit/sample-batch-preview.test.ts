import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import { prisma } from "@/server/db/client";
import { sha256 } from "@/server/operations/manufacturer-export";
import {
  buildSampleBatchPreview,
  buildSampleChecksumsText,
  buildSampleManufacturerWorkbook,
  buildSampleProductionDataCsv,
  buildSampleQrZip,
  buildSampleSupplierPackageZip,
  buildSupplierReturnTemplateCsv,
  decodeSampleUnits,
  encodeSampleUnits,
  SampleBatchConfirmationError,
  sampleUnitsToProductionRows,
} from "@/server/operations/sample-batch-preview";

describe("sample batch preview", () => {
  it("builds five non-persisted permanent URL candidates", async () => {
    const before = await prisma.device.count();
    const preview = await buildSampleBatchPreview();
    const after = await prisma.device.count();

    expect(preview.productionMode).toBe("SAMPLE");
    expect(preview.units).toHaveLength(5);
    expect(after).toBe(before);
    for (const unit of preview.units) {
      expect(unit.publicCode).toMatch(/^[A-Z2-9]{8}$/);
      expect(unit.publicUrl).toBe(`https://helplis.cl/p/${unit.publicCode}`);
      expect(unit.qrContent).toBe(unit.publicUrl);
      expect(unit.nfcContent).toBe(unit.publicUrl);
      expect(unit.initialState).toBe("UNACTIVATED");
    }
  });

  it("signs preview payloads and rejects malformed or expired previews", async () => {
    const now = new Date("2026-07-14T00:00:00.000Z");
    const preview = await buildSampleBatchPreview();
    const encoded = encodeSampleUnits(preview.units, { now, ttlMs: 60_000 });

    expect(decodeSampleUnits(encoded, { now })).toEqual(preview.units);

    try {
      decodeSampleUnits("", { now });
      throw new Error("Expected invalid preview to throw.");
    } catch (error) {
      expect(error).toBeInstanceOf(SampleBatchConfirmationError);
      expect((error as SampleBatchConfirmationError).code).toBe("INVALID_PREVIEW");
    }

    try {
      decodeSampleUnits(encoded.slice(0, -2), { now });
      throw new Error("Expected tampered preview to throw.");
    } catch (error) {
      expect(error).toBeInstanceOf(SampleBatchConfirmationError);
      expect((error as SampleBatchConfirmationError).code).toBe("INVALID_PREVIEW");
    }

    try {
      decodeSampleUnits(encoded, { now: new Date("2026-07-14T00:02:00.000Z") });
      throw new Error("Expected expired preview to throw.");
    } catch (error) {
      expect(error).toBeInstanceOf(SampleBatchConfirmationError);
      expect((error as SampleBatchConfirmationError).code).toBe("PREVIEW_EXPIRED");
    }
  });

  it("keeps manufacturer workbook and supplier template free of activation codes", async () => {
    const preview = await buildSampleBatchPreview();
    const workbook = await buildSampleManufacturerWorkbook(preview.units);
    const workbookZip = await JSZip.loadAsync(workbook);
    const workbookText = (
      await Promise.all(
        Object.values(workbookZip.files)
          .filter((file) => !file.dir)
          .map((file) => file.async("string").catch(() => "")),
      )
    ).join("\n");
    const productionSheet = await workbookZip.file("xl/worksheets/sheet1.xml")?.async("string");
    const template = buildSupplierReturnTemplateCsv(preview.units);
    const csv = buildSampleProductionDataCsv(preview.units);
    const rows = sampleUnitsToProductionRows(preview.units);

    expect(JSON.stringify(rows)).not.toMatch(/activation/i);
    expect(workbookText).not.toContain("activationCode");
    expect(productionSheet?.match(/<row /g)).toHaveLength(6);
    expect(csv.trim().split("\n")).toHaveLength(6);
    expect(template.trim().split("\n")).toHaveLength(6);
    expect(template).toContain("NFC UID");
    expect(template.split("\n").slice(1).every((line) => line.includes(',"","","","'))).toBe(true);
    expect(template).not.toMatch(/activation/i);
  });

  it("generates individual QR PNG and SVG assets for all five units", async () => {
    const preview = await buildSampleBatchPreview();
    const zipBuffer = await buildSampleQrZip(preview.units, "png");
    const pngZip = await JSZip.loadAsync(zipBuffer);
    const svgZip = await JSZip.loadAsync(await buildSampleQrZip(preview.units, "svg"));

    for (const unit of preview.units) {
      const pngBuffer = await pngZip.file(`${unit.publicCode}.png`)?.async("nodebuffer");
      const svg = await svgZip.file(`${unit.publicCode}.svg`)?.async("string");
      expect(pngBuffer).toBeTruthy();
      expect(svg).toContain("<svg");

      const png = PNG.sync.read(pngBuffer!);
      const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
      expect(decoded?.data).toBe(unit.publicUrl);
    }
  });

  it("builds a complete supplier zip with valid SHA-256 checksums and no activationCode token", async () => {
    const preview = await buildSampleBatchPreview();
    const zip = await JSZip.loadAsync(await buildSampleSupplierPackageZip(preview.units));
    const expectedFiles = [
      "production-data.csv",
      "production-data.xlsx",
      "instructions-en.txt",
      "supplier-return-template.csv",
      "manifest.json",
      "checksums-sha256.txt",
      ...preview.units.map((unit) => `qr-png/${unit.publicCode}.png`),
      ...preview.units.map((unit) => `qr-svg/${unit.publicCode}.svg`),
    ];

    for (const filename of expectedFiles) {
      expect(zip.file(filename), filename).toBeTruthy();
    }

    const checksums = (await zip.file("checksums-sha256.txt")?.async("string")) ?? "";
    for (const line of checksums.trim().split("\n")) {
      const [hash, filename] = line.split(/\s{2,}/);
      const file = zip.file(filename);
      expect(file, filename).toBeTruthy();
      const data = await file!.async("nodebuffer");
      expect(hash).toBe(sha256(data));
    }

    const standaloneChecksums = await buildSampleChecksumsText(preview.units);
    expect(standaloneChecksums.trim().split("\n")).toHaveLength(15);

    for (const file of Object.values(zip.files).filter((entry) => !entry.dir)) {
      const data = await file.async("nodebuffer");
      expect(data.toString("utf8")).not.toContain("activationCode");
    }
  });
});
