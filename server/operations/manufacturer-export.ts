import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ProductionFileType } from "@prisma/client";
import JSZip from "jszip";
import QRCode from "qrcode";
import { prisma } from "@/server/db/client";

export type ManufacturerExportFormat =
  | "URLS_ONLY"
  | "CSV"
  | "XLSX"
  | "QR_PNG_ZIP"
  | "QR_SVG_ZIP"
  | "FULL_PACKAGE";

export type ProductionExportRow = {
  wristband_reference: string;
  public_code: string;
  public_url: string;
  qr_content: string;
  nfc_content: string;
  qr_filename: string;
  batch_reference: string;
  product_type: string;
};

const productionColumns = [
  "wristband_reference",
  "public_code",
  "public_url",
  "qr_content",
  "nfc_content",
  "qr_filename",
  "batch_reference",
  "product_type",
] as const;

const productionRoot = path.join(process.cwd(), "data", "production");

export function neutralizeSpreadsheetFormula(value: string) {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

export function escapeCsvCell(value: string | number | null | undefined) {
  const safeValue = neutralizeSpreadsheetFormula(String(value ?? ""));
  return `"${safeValue.replaceAll('"', '""')}"`;
}

export function rowsToCsv(rows: ProductionExportRow[], columns: readonly (keyof ProductionExportRow)[] = productionColumns) {
  return [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => escapeCsvCell(row[column])).join(",")),
  ].join("\n");
}

export function sha256(data: Buffer | string) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function escapeXml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function columnName(index: number) {
  let column = "";
  let value = index + 1;
  while (value > 0) {
    const remainder = (value - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    value = Math.floor((value - remainder) / 26);
  }
  return column;
}

function sheetXml(rows: (string | number | null | undefined)[][]) {
  const body = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((cellValue, columnIndex) => {
          const ref = `${columnName(columnIndex)}${rowIndex + 1}`;
          return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(neutralizeSpreadsheetFormula(String(cellValue ?? "")))}</t></is></c>`;
        })
        .join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${body}</sheetData></worksheet>`;
}

export function manufacturerInstructionsEn() {
  return [
    "HelPlis wristband production instructions",
    "",
    "Each wristband has one unique public URL.",
    "The QR code must contain exactly the public URL in the production data.",
    "The NTAG213 NFC chip must contain exactly the same public URL.",
    "Matching is one-to-one: do not mix wristbands, QR codes, NFC chips or references.",
    "Read and return the NFC UID for every finished wristband.",
    "Verify that QR and NFC both open the same URL before packing.",
    "Return the production result file with wristband reference, public code, URL, NFC UID, QR result, NFC result and notes.",
    "Do not change, shorten, redirect or rewrite the URLs.",
    "Report any defective, missing or mismatched unit immediately.",
    "",
    "The standard supplier package intentionally does not include activation codes.",
  ].join("\n");
}

export function buildBatchSummary(input: {
  id: string;
  internalReference: string;
  supplierName: string;
  quantity: number;
  productType: string;
  productModel: string | null;
  color: string | null;
  chipType: string | null;
  domain: string;
  productionMode: string;
}) {
  return {
    batchId: input.id,
    batchReference: input.internalReference,
    supplierName: input.supplierName,
    quantity: input.quantity,
    productType: input.productType,
    productModel: input.productModel,
    color: input.color,
    chipType: input.chipType,
    domain: input.domain,
    productionMode: input.productionMode,
    generatedAt: new Date().toISOString(),
    activationCodeIncluded: false,
  };
}

function safeReference(value: string) {
  return value.replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "batch";
}

function typeForFormat(format: ManufacturerExportFormat) {
  if (format === "CSV" || format === "URLS_ONLY") return ProductionFileType.CSV;
  if (format === "XLSX") return ProductionFileType.XLSX;
  if (format === "QR_PNG_ZIP") return ProductionFileType.QR_PNG_ZIP;
  if (format === "QR_SVG_ZIP") return ProductionFileType.QR_SVG_ZIP;
  return ProductionFileType.FULL_PACKAGE_ZIP;
}

function filenameForFormat(batchReference: string, format: ManufacturerExportFormat) {
  const base = safeReference(batchReference).toLowerCase();
  if (format === "CSV" || format === "URLS_ONLY") return `${base}-production-data.csv`;
  if (format === "XLSX") return `${base}-production-data.xlsx`;
  if (format === "QR_PNG_ZIP") return `${base}-qr-png.zip`;
  if (format === "QR_SVG_ZIP") return `${base}-qr-svg.zip`;
  return `${base}-supplier-package.zip`;
}

export async function getProductionRowsForBatch(batchId: string) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: { devices: { orderBy: [{ internalSequence: "asc" }, { publicCode: "asc" }] } },
  });
  if (!batch) throw new Error("Batch not found.");
  if (!batch.devices.length) throw new Error("Generate production codes before exporting supplier files.");

  const rows = batch.devices.map((device, index) => {
    const sequence = String(device.internalSequence ?? index + 1).padStart(4, "0");
    const wristbandReference = `${batch.internalReference}-${sequence}`;
    return {
      wristband_reference: wristbandReference,
      public_code: device.publicCode,
      public_url: device.publicUrl,
      qr_content: device.qrContent ?? device.publicUrl,
      nfc_content: device.nfcContent ?? device.publicUrl,
      qr_filename: `${wristbandReference}.png`,
      batch_reference: batch.internalReference,
      product_type: device.productType,
    };
  });

  return { batch, rows };
}

export async function rowsToWorkbookBuffer(rows: ProductionExportRow[]) {
  const zip = new JSZip();
  const productionRows = [
    ["Wristband Reference", "Public Code", "Public URL", "QR Content", "NFC Content", "QR Filename", "Batch Reference"],
    ...rows.map((row) => [
      row.wristband_reference,
      row.public_code,
      row.public_url,
      row.qr_content,
      row.nfc_content,
      row.qr_filename,
      row.batch_reference,
    ]),
  ];
  const instructionRows = manufacturerInstructionsEn()
    .split("\n")
    .map((line) => [line]);

  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
  );
  zip.folder("_rels")?.file(
    ".rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`,
  );
  zip.folder("docProps")?.file(
    "core.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/"><dc:title>HelPlis production data</dc:title><dc:creator>HelPlis</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">${new Date().toISOString()}</dcterms:created></cp:coreProperties>`,
  );
  zip.folder("docProps")?.file(
    "app.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>HelPlis</Application></Properties>`,
  );
  zip.folder("xl")?.file(
    "workbook.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Production Data" sheetId="1" r:id="rId1"/><sheet name="Instructions" sheetId="2" r:id="rId2"/></sheets></workbook>`,
  );
  zip.folder("xl")?.folder("_rels")?.file(
    "workbook.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/></Relationships>`,
  );
  zip.folder("xl")?.folder("worksheets")?.file("sheet1.xml", sheetXml(productionRows));
  zip.folder("xl")?.folder("worksheets")?.file("sheet2.xml", sheetXml(instructionRows));

  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

async function addQrAssets(zip: JSZip, rows: ProductionExportRow[], kind: "png" | "svg") {
  const folder = zip.folder(kind === "png" ? "qr-png" : "qr-svg");
  if (!folder) throw new Error("Could not create QR folder.");

  for (const row of rows) {
    const baseName = row.qr_filename.replace(/\.png$/i, "");
    if (kind === "png") {
      const png = await QRCode.toBuffer(row.qr_content, { type: "png", margin: 1, width: 512 });
      folder.file(`${baseName}.png`, png);
    } else {
      const svg = await QRCode.toString(row.qr_content, { type: "svg", margin: 1, width: 512 });
      folder.file(`${baseName}.svg`, svg);
    }
  }
}

async function buildArtifact(format: ManufacturerExportFormat, rows: ProductionExportRow[], batch: Awaited<ReturnType<typeof getProductionRowsForBatch>>["batch"]) {
  const csvRows = format === "URLS_ONLY" ? rows.map((row) => ({ ...row, qr_content: row.public_url, nfc_content: row.public_url })) : rows;
  const csv = rowsToCsv(csvRows, format === "URLS_ONLY" ? ["public_url"] : productionColumns);
  if (format === "CSV" || format === "URLS_ONLY") return Buffer.from(csv, "utf8");
  if (format === "XLSX") return rowsToWorkbookBuffer(rows);

  const zip = new JSZip();
  if (format === "QR_PNG_ZIP") {
    await addQrAssets(zip, rows, "png");
    return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  }
  if (format === "QR_SVG_ZIP") {
    await addQrAssets(zip, rows, "svg");
    return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  }

  const workbook = await rowsToWorkbookBuffer(rows);
  const instructions = manufacturerInstructionsEn();
  const summary = JSON.stringify(buildBatchSummary(batch), null, 2);
  const checksums: string[] = [];

  zip.file("production-data.csv", csv);
  checksums.push(`production-data.csv  ${sha256(csv)}`);
  zip.file("production-data.xlsx", workbook);
  checksums.push(`production-data.xlsx  ${sha256(workbook)}`);
  zip.file("instructions-en.txt", instructions);
  checksums.push(`instructions-en.txt  ${sha256(instructions)}`);
  zip.file("batch-summary.json", summary);
  checksums.push(`batch-summary.json  ${sha256(summary)}`);
  await addQrAssets(zip, rows, "png");
  await addQrAssets(zip, rows, "svg");
  zip.file("checksums.txt", checksums.join("\n"));

  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

export async function generateManufacturerExportPackage(input: {
  batchId: string;
  format: ManufacturerExportFormat;
  generatedBy?: string;
}) {
  const { batch, rows } = await getProductionRowsForBatch(input.batchId);
  const filename = filenameForFormat(batch.internalReference, input.format);
  const directory = path.join(productionRoot, safeReference(batch.internalReference), String(Date.now()));
  await mkdir(directory, { recursive: true });

  const artifact = await buildArtifact(input.format, rows, batch);
  const storagePath = path.join(directory, filename);
  await writeFile(storagePath, artifact);

  const productionFile = await prisma.productionFile.create({
    data: {
      batchId: batch.id,
      type: typeForFormat(input.format),
      filename,
      storagePath,
      checksum: sha256(artifact),
      generatedBy: input.generatedBy,
      status: "READY",
      metadata: JSON.stringify({
        format: input.format,
        rows: rows.length,
        activationCodeIncluded: false,
      }),
    },
  });

  await prisma.batch.update({
    where: { id: batch.id },
    data: { status: "FILES_READY" },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: input.generatedBy,
      action: "MANUFACTURER_EXPORT_GENERATED",
      entityType: "ProductionFile",
      entityId: productionFile.id,
      newData: JSON.stringify({
        batchId: batch.id,
        internalReference: batch.internalReference,
        format: input.format,
        filename,
        checksum: productionFile.checksum,
        activationCodeIncluded: false,
      }),
    },
  });

  return productionFile;
}
