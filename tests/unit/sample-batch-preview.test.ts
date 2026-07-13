import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import { prisma } from "@/server/db/client";
import {
  buildSampleBatchPreview,
  buildSampleManufacturerWorkbook,
  buildSampleQrZip,
  buildSupplierReturnTemplateCsv,
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

  it("keeps manufacturer workbook and supplier template free of activation codes", async () => {
    const preview = await buildSampleBatchPreview();
    const workbook = await buildSampleManufacturerWorkbook(preview.units);
    const template = buildSupplierReturnTemplateCsv(preview.units);
    const rows = sampleUnitsToProductionRows(preview.units);

    expect(JSON.stringify(rows)).not.toMatch(/activation/i);
    expect(workbook.toString("utf8")).not.toMatch(/activation/i);
    expect(template).toContain("NFC UID");
    expect(template).not.toMatch(/activation/i);
  });

  it("generates QR PNG assets that decode to the expected URL", async () => {
    const preview = await buildSampleBatchPreview();
    const zipBuffer = await buildSampleQrZip(preview.units, "png");
    const zip = await JSZip.loadAsync(zipBuffer);
    const first = preview.units[0];
    const pngBuffer = await zip.file(`${first.publicCode}.png`)?.async("nodebuffer");
    expect(pngBuffer).toBeTruthy();

    const png = PNG.sync.read(pngBuffer!);
    const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
    expect(decoded?.data).toBe(first.publicUrl);
  });
});
