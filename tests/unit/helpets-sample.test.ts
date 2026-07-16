import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import { prisma } from "@/server/db/client";
import { sha256 } from "@/server/operations/manufacturer-export";
import {
  buildHelpetsInternalPackageZip,
  buildHelpetsProductionDataCsv,
  buildHelpetsSamplePreview,
  buildHelpetsSimplePackageFiles,
  buildHelpetsSupplierReturnTemplateCsv,
  buildHelpetsWorkbookBuffer,
  decodeHelpetsSampleUnits,
  encodeHelpetsSampleUnits,
  HelpetsSampleConfirmationError,
  HELPETS_SAMPLE_BATCH_REFERENCE,
} from "@/server/operations/helpets-sample";

const personasCodes = new Set(["SJRUPNZQ", "BCM3BLAJ", "H26EJYQW", "THAHHRYR", "TCR6MTJB"]);

describe("Helpets sample preview", () => {
  it("builds five non-persisted PET_TAG candidates separated from Personas", async () => {
    const batchBefore = await prisma.batch.findUnique({ where: { internalReference: HELPETS_SAMPLE_BATCH_REFERENCE } });
    const preview = await buildHelpetsSamplePreview();
    const persistedPreviewCodes = await prisma.device.count({
      where: { publicCode: { in: preview.units.map((unit) => unit.publicCode) } },
    });
    const batchAfter = await prisma.batch.findUnique({ where: { internalReference: HELPETS_SAMPLE_BATCH_REFERENCE } });

    expect(batchAfter?.id ?? null).toBe(batchBefore?.id ?? null);
    expect(persistedPreviewCodes).toBe(0);
    expect(preview.internalReference).toBe(HELPETS_SAMPLE_BATCH_REFERENCE);
    expect(preview.productLine).toBe("HELPETS");
    expect(preview.profileType).toBe("PET");
    expect(preview.deviceType).toBe("PET_TAG");
    expect(preview.units).toHaveLength(5);

    for (const [index, unit] of preview.units.entries()) {
      expect(unit.tagReference).toBe(`P-${String(index + 1).padStart(3, "0")}`);
      expect(unit.publicCode).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/);
      expect(personasCodes.has(unit.publicCode)).toBe(false);
      expect(unit.publicUrl).toBe(`https://helplis.cl/p/${unit.publicCode}`);
      expect(unit.qrContent).toBe(unit.publicUrl);
      expect(unit.nfcContent).toBe(unit.publicUrl);
      expect(unit.qrUrl).toBe(unit.publicUrl);
      expect(unit.nfcUrl).toBe(unit.publicUrl);
      expect(unit.initialState).toBe("UNACTIVATED");
      expect(unit.inventoryInitialState).toBe("UNASSIGNED");
      expect(unit.productLine).toBe("HELPETS");
      expect(unit.profileType).toBe("PET");
      expect(unit.deviceType).toBe("PET_TAG");
    }
  });

  it("signs preview payloads and rejects invalid or expired previews", async () => {
    const now = new Date("2026-07-15T00:00:00.000Z");
    const preview = await buildHelpetsSamplePreview();
    const encoded = encodeHelpetsSampleUnits(preview.units, { now, ttlMs: 60_000 });

    expect(decodeHelpetsSampleUnits(encoded, { now })).toEqual(preview.units);

    try {
      decodeHelpetsSampleUnits("", { now });
      throw new Error("Expected invalid preview to throw.");
    } catch (error) {
      expect(error).toBeInstanceOf(HelpetsSampleConfirmationError);
      expect((error as HelpetsSampleConfirmationError).code).toBe("INVALID_PREVIEW");
    }

    try {
      decodeHelpetsSampleUnits(encoded, { now: new Date("2026-07-15T00:02:00.000Z") });
      throw new Error("Expected expired preview to throw.");
    } catch (error) {
      expect(error).toBeInstanceOf(HelpetsSampleConfirmationError);
      expect((error as HelpetsSampleConfirmationError).code).toBe("PREVIEW_EXPIRED");
    }
  });

  it("builds supplier XLSX/CSV with five rows and no activation data", async () => {
    const preview = await buildHelpetsSamplePreview();
    const csv = buildHelpetsProductionDataCsv(preview.units);
    const returnTemplate = buildHelpetsSupplierReturnTemplateCsv(preview.units);
    const workbook = await buildHelpetsWorkbookBuffer(preview.units);
    const workbookZip = await JSZip.loadAsync(workbook);
    const productionSheet = await workbookZip.file("xl/worksheets/sheet1.xml")?.async("string");

    expect(csv.trim().split("\n")).toHaveLength(6);
    expect(csv).toContain("Tag Reference");
    expect(returnTemplate.trim().split("\n")).toHaveLength(6);
    expect(returnTemplate).toContain("NFC UID");
    expect(productionSheet?.match(/<row /g)).toHaveLength(6);
    expect(`${csv}\n${returnTemplate}\n${productionSheet}`).not.toMatch(/activationCode|activationCodeHash/i);
  });

  it("builds the exact simple package file list without secrets or QR files", async () => {
    const preview = await buildHelpetsSamplePreview();
    const files = await buildHelpetsSimplePackageFiles(preview.units);
    const paths = files.map((file) => file.path).sort();

    expect(paths).toEqual(
      [
        "01-helpets-5-urls.xlsx",
        "02-helpets-5-urls.csv",
        "03-helpets-front-logo-color.pdf",
        "04-helpets-front-logo-black.pdf",
        "05-helpets-front-logo-color.svg",
        "06-helpets-front-logo-black.svg",
        "07-helpets-back-layout.pdf",
        "08-helpets-back-layout.svg",
        "09-message-to-leanne.txt",
      ].sort(),
    );
    expect(paths.some((file) => /qr-(png|svg)|activation/i.test(file))).toBe(false);

    for (const file of files) {
      const text = Buffer.isBuffer(file.data) ? file.data.toString("utf8") : file.data;
      expect(text).not.toMatch(/activationCode|activationCodeHash|ownerId|profileId|service_role|DATABASE_URL/i);
    }

    const blackLogo = String(files.find((file) => file.path === "06-helpets-front-logo-black.svg")?.data ?? "");
    const backLayout = String(files.find((file) => file.path === "08-helpets-back-layout.svg")?.data ?? "");
    expect(blackLogo).not.toContain("linearGradient");
    expect(blackLogo).not.toContain("url(#");
    expect(backLayout).toContain("VARIABLE QR - REPLACE PER TAG");
    expect(backLayout).toContain("HelPlis logo");
    expect(backLayout).not.toMatch(/helpets-vertical|HelPets vertical/i);
  });

  it("builds the internal package with QR PNG/SVG assets and valid checksums", async () => {
    const preview = await buildHelpetsSamplePreview();
    const zip = await JSZip.loadAsync(await buildHelpetsInternalPackageZip(preview.units));
    const files = Object.values(zip.files)
      .filter((entry) => !entry.dir)
      .map((entry) => entry.name);

    const pngFiles = files.filter((file) => file.startsWith("qr-png/") && file.endsWith(".png"));
    const svgFiles = files.filter((file) => file.startsWith("qr-svg/") && file.endsWith(".svg"));
    expect(pngFiles).toHaveLength(5);
    expect(svgFiles).toHaveLength(5);
    expect(files).toContain("checksums-sha256.txt");
    expect(files).toContain("supplier-return/supplier-return-template.csv");
    expect(files).toContain("validations/manifest.json");

    for (const unit of preview.units) {
      const pngBuffer = await zip.file(`qr-png/${unit.tagReference}-${unit.publicCode}.png`)?.async("nodebuffer");
      expect(pngBuffer).toBeTruthy();
      const png = PNG.sync.read(pngBuffer!);
      const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
      expect(decoded?.data).toBe(unit.publicUrl);
    }

    const checksums = (await zip.file("checksums-sha256.txt")?.async("string")) ?? "";
    for (const line of checksums.trim().split("\n")) {
      const [hash, filename] = line.split(/\s{2,}/);
      const file = zip.file(filename);
      expect(file, filename).toBeTruthy();
      const data = await file!.async("nodebuffer");
      expect(hash).toBe(sha256(data));
    }
  }, 30_000);
});
