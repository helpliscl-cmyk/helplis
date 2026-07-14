import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { ProductionFileType } from "@prisma/client";
import JSZip from "jszip";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import QRCode from "qrcode";
import sharp from "sharp";
import { escapeCsvCell, sha256 } from "@/server/operations/manufacturer-export";
import { prisma } from "@/server/db/client";
import {
  SUPPLIER_SAMPLE_BATCH_REFERENCE,
  SUPPLIER_SAMPLE_EXPORT_NAME,
  SUPPLIER_SAMPLE_PUBLIC_CODES,
} from "@/server/operations/supplier-sample-constants";

export { SUPPLIER_SAMPLE_BATCH_REFERENCE, SUPPLIER_SAMPLE_EXPORT_NAME, SUPPLIER_SAMPLE_PUBLIC_CODES };
const workspaceRoot = /*turbopackIgnore: true*/ process.cwd();
export const SUPPLIER_SAMPLE_EXPORT_ROOT = path.join(workspaceRoot, "exports", SUPPLIER_SAMPLE_EXPORT_NAME);
export const SUPPLIER_SAMPLE_ZIP_PATH = path.join(workspaceRoot, "exports", `${SUPPLIER_SAMPLE_EXPORT_NAME}.zip`);

export type SupplierSampleUnit = {
  wristbandReference: string;
  publicCode: string;
  publicUrl: string;
  qrContent: string;
  nfcContent: string;
  qrPngFilename: string;
  qrSvgFilename: string;
  batchReference: string;
};

export type SupplierSampleBuildResult = {
  folderPath: string;
  zipPath: string;
  zipChecksum: string;
  zipSizeBytes: number;
  files: string[];
  units: SupplierSampleUnit[];
  productionFileId?: string;
};

const productionHeaders = [
  "Wristband Reference",
  "Public Code",
  "Public URL",
  "QR Content",
  "NFC Content",
  "QR PNG Filename",
  "QR SVG Filename",
  "Batch Reference",
] as const;

const supplierReturnHeaders = [
  "Wristband Reference",
  "Public Code",
  "Public URL",
  "NFC UID",
  "QR Test Result",
  "NFC Test Result",
  "Physical Condition",
  "Notes",
] as const;

const requiredRelativeFiles = [
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
  ...SUPPLIER_SAMPLE_PUBLIC_CODES.map((code) => `qr-png/${code}.png`),
  ...SUPPLIER_SAMPLE_PUBLIC_CODES.map((code) => `qr-svg/${code}.svg`),
].sort();
const fixedPackageDate = new Date("2026-07-14T00:00:00.000Z");
const fixedPackageTimestamp = fixedPackageDate.toISOString();

const secretPatterns = [
  /activationCode/i,
  /activationCodeHash/i,
  /DATABASE_URL/i,
  /DIRECT_URL/i,
  /SUPABASE_SERVICE_ROLE_KEY/i,
  /SUPABASE_SECRET_KEY/i,
  /POSTGRES_PASSWORD/i,
  /AUTH_SECRET/i,
  /tokens?/i,
  /cookies?/i,
  /ownerId/i,
  /profileId/i,
  /userId/i,
  /\.env/i,
  /node_modules/i,
  /\.git/i,
  /MIME_MINEDUC/i,
  /crm/i,
  /colegio/i,
];

function escapeXml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function escapePdfText(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
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

function workbookSheetXml(rows: string[][], options: { widths: number[] }) {
  const cols = options.widths
    .map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`)
    .join("");
  const body = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, columnIndex) => {
          const ref = `${columnName(columnIndex)}${rowIndex + 1}`;
          const style = rowIndex === 0 ? 1 : 0;
          return `<c r="${ref}" s="${style}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
        })
        .join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${cols}</cols><sheetData>${body}</sheetData><autoFilter ref="A1:${columnName(rows[0].length - 1)}${rows.length}"/></worksheet>`;
}

async function buildWorkbookBuffer(sheets: { name: string; rows: string[][]; widths: number[] }[]) {
  const zip = new JSZip();
  const addFile = (filename: string, data: string | Buffer) =>
    zip.file(filename, data, { createFolders: false, date: fixedPackageDate });
  addFile(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`,
  );
  addFile(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`,
  );
  addFile(
    "docProps/core.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/"><dc:title>HelPlis supplier sample package</dc:title><dc:creator>HelPlis</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">${fixedPackageTimestamp}</dcterms:created></cp:coreProperties>`,
  );
  addFile(
    "docProps/app.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>HelPlis</Application></Properties>`,
  );
  addFile(
    "xl/workbook.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((sheet, index) => `<sheet name="${escapeXml(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join("")}</sheets></workbook>`,
  );
  addFile(
    "xl/styles.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Aptos"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Aptos"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF082B5D"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="49" fontId="1" fillId="1" borderId="0" xfId="0" applyFont="1" applyFill="1" applyNumberFormat="1"/></cellXfs></styleSheet>`,
  );
  addFile(
    "xl/_rels/workbook.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join("")}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
  );
  for (const [index, sheet] of sheets.entries()) {
    addFile(`xl/worksheets/sheet${index + 1}.xml`, workbookSheetXml(sheet.rows, { widths: sheet.widths }));
  }
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

function productionRows(units: SupplierSampleUnit[]) {
  return [
    [...productionHeaders],
    ...units.map((unit) => [
      unit.wristbandReference,
      unit.publicCode,
      unit.publicUrl,
      unit.qrContent,
      unit.nfcContent,
      unit.qrPngFilename,
      unit.qrSvgFilename,
      unit.batchReference,
    ]),
  ];
}

function supplierReturnRows(units: SupplierSampleUnit[]) {
  return [
    [...supplierReturnHeaders],
    ...units.map((unit) => [unit.wristbandReference, unit.publicCode, unit.publicUrl, "", "", "", "", ""]),
  ];
}

export function manufacturingInstructionsText() {
  return [
    "HelPlis - Five Functional NFC Wristband Samples",
    "",
    "Order:",
    SUPPLIER_SAMPLE_BATCH_REFERENCE,
    "",
    "Quantity:",
    "5 functional wristbands",
    "",
    "Requirements:",
    "",
    "1. Each wristband must use the exact Public URL assigned in the production spreadsheet.",
    "2. Each wristband must have a different QR code.",
    "3. The QR code must encode the exact Public URL in the same row.",
    "4. The NTAG213 chip inside that wristband must be programmed with the exact same Public URL.",
    "5. QR and NFC must open the same URL.",
    "6. One-to-one matching must be preserved.",
    "7. Do not duplicate, exchange, modify or shorten URLs.",
    "8. Do not use the NFC UID as the URL.",
    "9. Do not add activation codes to QR or NFC.",
    "10. Use the official HelPlis vector logo.",
    "11. Send a digital mockup before producing samples.",
    "12. Before shipment, send clear group photos of all five wristbands.",
    "13. Before shipment, send one continuous video testing QR and NFC for all five wristbands.",
    "14. Return the NTAG213 UID matched to each wristband, Public Code and Public URL.",
    "15. Report any failed, damaged or mismatched unit before shipment.",
    "",
    "Validation sequence:",
    "",
    "For each wristband:",
    "",
    "- scan QR;",
    "- confirm expected URL;",
    "- read NFC;",
    "- confirm same expected URL;",
    "- read NFC UID;",
    "- record UID in supplier return file;",
    "- mark QR Test Result PASS or FAIL;",
    "- mark NFC Test Result PASS or FAIL.",
  ].join("\n");
}

function readmeText() {
  return [
    "HELPLIS SAMPLE PRODUCTION PACKAGE",
    "",
    "Batch:",
    SUPPLIER_SAMPLE_BATCH_REFERENCE,
    "",
    "Quantity:",
    "5 functional wristbands",
    "",
    "Please review:",
    "1. 01-production-data.xlsx",
    "2. 03-manufacturing-instructions-en.pdf",
    "3. branding files",
    "4. QR folders",
    "5. 05-supplier-return-template.xlsx",
    "",
    "Important:",
    "- Every wristband has a different Public URL.",
    "- QR and NFC on the same wristband must contain the exact same URL.",
    "- Send a digital mockup before production.",
    "- Send group photos, continuous QR/NFC test video and completed URL-UID matching file before shipment.",
    "- Do not modify any URL.",
    "- Do not add activation codes.",
    "",
    "Contact:",
    "Sebastian Urrea",
    "admin@helplis.cl",
    "+56 9 8845 5230",
    "https://helplis.cl",
  ].join("\n");
}

function brandingReadmeText() {
  return [
    "HelPlis branding instructions",
    "",
    "- Use the supplied vector logo.",
    "- Do not redraw or modify the logo.",
    "- Do not change proportions.",
    "- Do not change typography.",
    "- Do not add effects.",
    "- Final logo size and print area must be confirmed in the supplier's digital mockup.",
    "- The QR code must remain fully readable.",
    "- The QR code must not overlap the logo or wristband edges.",
    "- The NFC icon is a visual indicator only.",
    "- Send a digital mockup for written approval before production.",
  ].join("\n");
}

function returnInstructionsRows() {
  return [
    ["Return Instructions"],
    [""],
    ["- NFC UID must be read from the corresponding NTAG213 chip."],
    ["- Do not exchange rows."],
    ["- Use PASS or FAIL."],
    ["- Explain any failure in Notes."],
    ["- Return this completed file before shipment."],
  ];
}

function buildPdf(lines: string[]) {
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 48;
  const lineHeight = 15;
  const maxLines = Math.floor((pageHeight - margin * 2) / lineHeight);
  const pages: string[][] = [];
  for (let index = 0; index < lines.length; index += maxLines) pages.push(lines.slice(index, index + maxLines));

  const objects: string[] = [];
  const addObject = (content: string) => {
    objects.push(content);
    return objects.length;
  };
  const catalogId = addObject("<< /Type /Catalog /Pages 2 0 R >>");
  const pagesId = addObject("");
  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const pageIds: number[] = [];
  for (const pageLines of pages) {
    const textOps = pageLines
      .map((line, index) => {
        const fontSize = index === 0 && pageIds.length === 0 ? 16 : 10;
        const y = pageHeight - margin - index * lineHeight;
        return `BT /F1 ${fontSize} Tf ${margin} ${y} Td (${escapePdfText(line)}) Tj ET`;
      })
      .join("\n");
    const streamId = addObject(`<< /Length ${Buffer.byteLength(textOps, "utf8")} >>\nstream\n${textOps}\nendstream`);
    const pageId = addObject(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${streamId} 0 R >>`,
    );
    pageIds.push(pageId);
  }
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
  objects[catalogId - 1] = "<< /Type /Catalog /Pages 2 0 R >>";

  const chunks = ["%PDF-1.7\n"];
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(chunks.join(""), "utf8"));
    chunks.push(`${index + 1} 0 obj\n${object}\nendobj\n`);
  }
  const xrefOffset = Buffer.byteLength(chunks.join(""), "utf8");
  chunks.push(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`);
  for (const offset of offsets.slice(1)) chunks.push(`${String(offset).padStart(10, "0")} 00000 n \n`);
  chunks.push(`trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);
  return Buffer.from(chunks.join(""), "utf8");
}

function buildLayoutReferenceSvg(logoSvg: string) {
  const logoData = Buffer.from(logoSvg).toString("base64");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="600" viewBox="0 0 1600 600">
  <rect width="1600" height="600" fill="#ffffff"/>
  <text x="800" y="70" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" fill="#082b5d">REFERENCE LAYOUT - FINAL DIMENSIONS TO BE CONFIRMED BY SUPPLIER</text>
  <rect x="100" y="155" width="280" height="280" fill="#ffffff" stroke="#111111" stroke-width="10"/>
  <path d="M135 190h70v70h-70zM275 190h70v70h-70zM135 330h70v70h-70z" fill="#111111"/>
  <path d="M225 205h25v25h-25zM225 250h80v25h-80zM220 305h55v25h-55zM295 305h35v95h-35zM225 355h45v45h-45z" fill="#111111"/>
  <text x="240" y="480" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#111111">Unique QR</text>
  <line x1="500" y1="140" x2="500" y2="470" stroke="#111111" stroke-width="6"/>
  <image x="610" y="210" width="430" height="150" href="data:image/svg+xml;base64,${logoData}" preserveAspectRatio="xMidYMid meet"/>
  <text x="825" y="420" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#111111">Official HelPlis vector logo</text>
  <line x1="1120" y1="140" x2="1120" y2="470" stroke="#111111" stroke-width="6"/>
  <path d="M1260 245c45 30 45 80 0 110" fill="none" stroke="#111111" stroke-width="18" stroke-linecap="round"/>
  <path d="M1315 205c85 62 85 190 0 252" fill="none" stroke="#111111" stroke-width="18" stroke-linecap="round"/>
  <rect x="1200" y="220" width="80" height="170" rx="14" fill="none" stroke="#111111" stroke-width="16"/>
  <circle cx="1240" cy="365" r="8" fill="#111111"/>
  <text x="1290" y="480" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#111111">NFC visual indicator</text>
  <text x="800" y="545" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#4b5563">Concept only. Do not use as final artwork. Supplier must send digital mockup for written approval.</text>
</svg>`;
}

async function collectFiles(root: string) {
  const entries: string[] = [];
  async function walk(directory: string) {
    for (const item of await readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, item.name);
      const relative = path.relative(root, absolute).replaceAll(path.sep, "/");
      if (item.isDirectory()) {
        await walk(absolute);
      } else {
        entries.push(relative);
      }
    }
  }
  await walk(root);
  return entries.sort();
}

async function writeChecksums(root: string) {
  const files = (await collectFiles(root)).filter((file) => file !== "06-checksums-sha256.txt");
  const lines = await Promise.all(
    files.map(async (file) => `${sha256(await readFile(path.join(root, file)))}  ${file}`),
  );
  await writeFile(path.join(root, "06-checksums-sha256.txt"), `${lines.sort().join("\n")}\n`, "utf8");
}

async function buildZip(root: string, zipPath: string) {
  const zip = new JSZip();
  for (const relative of await collectFiles(root)) {
    zip.file(`${SUPPLIER_SAMPLE_EXPORT_NAME}/${relative}`, await readFile(path.join(root, relative)), {
      createFolders: false,
      date: fixedPackageDate,
    });
  }
  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  await writeFile(zipPath, buffer);
  return buffer;
}

function expectedUrl(publicCode: string) {
  return `https://helplis.cl/p/${publicCode}`;
}

export function assertSupplierSampleUnits(units: SupplierSampleUnit[]) {
  if (units.length !== SUPPLIER_SAMPLE_PUBLIC_CODES.length) throw new Error("Supplier sample package requires exactly five units.");
  units.forEach((unit, index) => {
    const expectedCode = SUPPLIER_SAMPLE_PUBLIC_CODES[index];
    const expectedReference = `W-${String(index + 1).padStart(3, "0")}`;
    const url = expectedUrl(expectedCode);
    if (unit.publicCode !== expectedCode) throw new Error(`Unexpected publicCode at row ${index + 1}.`);
    if (unit.wristbandReference !== expectedReference) throw new Error(`Unexpected wristband reference for ${unit.publicCode}.`);
    if (unit.batchReference !== SUPPLIER_SAMPLE_BATCH_REFERENCE) throw new Error(`Unexpected batch reference for ${unit.publicCode}.`);
    if (unit.publicUrl !== url || unit.qrContent !== url || unit.nfcContent !== url) {
      throw new Error(`URL invariant failed for ${unit.publicCode}.`);
    }
    if (unit.qrPngFilename !== `${unit.publicCode}.png` || unit.qrSvgFilename !== `${unit.publicCode}.svg`) {
      throw new Error(`Unexpected QR filename for ${unit.publicCode}.`);
    }
  });
}

export async function getSupplierSampleUnitsFromDatabase() {
  const batch = await prisma.batch.findUnique({
    where: { internalReference: SUPPLIER_SAMPLE_BATCH_REFERENCE },
    include: {
      devices: {
        orderBy: { internalSequence: "asc" },
        select: {
          internalSequence: true,
          publicCode: true,
          publicUrl: true,
          qrContent: true,
          nfcContent: true,
        },
      },
    },
  });
  if (!batch) throw new Error(`${SUPPLIER_SAMPLE_BATCH_REFERENCE} does not exist.`);
  if (batch.devices.length !== 5) throw new Error(`${SUPPLIER_SAMPLE_BATCH_REFERENCE} must have exactly five devices.`);
  const units = batch.devices.map((device, index) => ({
    wristbandReference: `W-${String(device.internalSequence ?? index + 1).padStart(3, "0")}`,
    publicCode: device.publicCode,
    publicUrl: device.publicUrl,
    qrContent: device.qrContent ?? device.publicUrl,
    nfcContent: device.nfcContent ?? device.publicUrl,
    qrPngFilename: `${device.publicCode}.png`,
    qrSvgFilename: `${device.publicCode}.svg`,
    batchReference: batch.internalReference,
  }));
  assertSupplierSampleUnits(units);
  return { batch, units };
}

export async function decodeQrPng(data: Buffer) {
  const png = PNG.sync.read(data);
  const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  return decoded?.data ?? null;
}

async function decodeQrSvg(data: Buffer | string) {
  const png = await sharp(Buffer.isBuffer(data) ? data : Buffer.from(data)).png().toBuffer();
  return decodeQrPng(png);
}

async function writeQrFiles(root: string, units: SupplierSampleUnit[]) {
  await mkdir(path.join(root, "qr-png"), { recursive: true });
  await mkdir(path.join(root, "qr-svg"), { recursive: true });
  for (const unit of units) {
    const png = await QRCode.toBuffer(unit.publicUrl, {
      type: "png",
      margin: 4,
      width: 1200,
      color: { dark: "#000000", light: "#FFFFFF" },
      errorCorrectionLevel: "M",
    });
    const svg = await QRCode.toString(unit.publicUrl, {
      type: "svg",
      margin: 4,
      width: 1200,
      color: { dark: "#000000", light: "#FFFFFF" },
      errorCorrectionLevel: "M",
    });
    await writeFile(path.join(root, "qr-png", unit.qrPngFilename), png);
    await writeFile(path.join(root, "qr-svg", unit.qrSvgFilename), svg, "utf8");
    const decodedPng = await decodeQrPng(png);
    const decodedSvg = await decodeQrSvg(svg);
    if (decodedPng !== unit.publicUrl || decodedSvg !== unit.publicUrl) {
      throw new Error(`QR decode mismatch for ${unit.publicCode}.`);
    }
  }
}

async function resolveLogoAssets() {
  const pdfPath = path.join(workspaceRoot, "public", "brand", "vector", "helplis_logo_vector.pdf");
  const svgPath = path.join(workspaceRoot, "public", "brand", "vector", "helplis_logo_vector.svg");
  if (!existsSync(pdfPath)) throw new Error("Official HelPlis vector PDF was not found in public/brand/vector.");
  if (!existsSync(svgPath)) throw new Error("Official HelPlis vector SVG was not found in public/brand/vector.");
  return { pdfPath, svgPath };
}

async function writeBranding(root: string) {
  const brandingRoot = path.join(root, "branding");
  await mkdir(brandingRoot, { recursive: true });
  const { pdfPath, svgPath } = await resolveLogoAssets();
  const pdf = await readFile(pdfPath);
  const svg = await readFile(svgPath, "utf8");
  if (svg.includes("<script") || /href=["']https?:/i.test(svg)) throw new Error("Logo SVG contains scripts or external references.");
  await writeFile(path.join(brandingRoot, "helplis-logo-vector.pdf"), pdf);
  await writeFile(path.join(brandingRoot, "helplis-logo-vector.svg"), svg, "utf8");
  await writeFile(path.join(brandingRoot, "README-branding.txt"), brandingReadmeText(), "utf8");
  const layoutSvg = buildLayoutReferenceSvg(svg);
  const png = await sharp(Buffer.from(layoutSvg)).png().toBuffer();
  await writeFile(path.join(brandingRoot, "layout-reference.png"), png);
}

function buildProductionCsv(units: SupplierSampleUnit[]) {
  return `${productionRows(units).map((row) => row.map((cell) => escapeCsvCell(cell)).join(",")).join("\n")}\n`;
}

async function writePackageFiles(root: string, units: SupplierSampleUnit[]) {
  await mkdir(root, { recursive: true });
  await writeFile(path.join(root, "00-README-FIRST.txt"), readmeText(), "utf8");
  await writeFile(
    path.join(root, "01-production-data.xlsx"),
    await buildWorkbookBuffer([
      { name: "Production Data", rows: productionRows(units), widths: [22, 16, 34, 34, 34, 20, 20, 24] },
      { name: "Instructions", rows: manufacturingInstructionsText().split("\n").map((line) => [line]), widths: [120] },
    ]),
  );
  await writeFile(path.join(root, "02-production-data.csv"), buildProductionCsv(units), "utf8");
  await writeFile(path.join(root, "03-manufacturing-instructions-en.pdf"), buildPdf(manufacturingInstructionsText().split("\n")));
  await writeFile(path.join(root, "04-manufacturing-instructions-en.txt"), manufacturingInstructionsText(), "utf8");
  await writeFile(
    path.join(root, "05-supplier-return-template.xlsx"),
    await buildWorkbookBuffer([
      { name: "Supplier Return", rows: supplierReturnRows(units), widths: [22, 16, 34, 18, 18, 18, 20, 40] },
      { name: "Return Instructions", rows: returnInstructionsRows(), widths: [110] },
    ]),
  );
  await writeBranding(root);
  await writeQrFiles(root, units);
  await writeChecksums(root);
}

export async function buildSupplierSamplePackage(input: {
  units: SupplierSampleUnit[];
  outputRoot?: string;
  zipPath?: string;
}) {
  const outputRoot = input.outputRoot ?? SUPPLIER_SAMPLE_EXPORT_ROOT;
  const zipPath = input.zipPath ?? SUPPLIER_SAMPLE_ZIP_PATH;
  assertSupplierSampleUnits(input.units);
  const exportsRoot = path.resolve(workspaceRoot, "exports");
  const outputRelative = path.relative(exportsRoot, path.resolve(outputRoot));
  if (outputRelative.startsWith("..") || path.isAbsolute(outputRelative)) {
    throw new Error("Supplier sample output must stay inside exports.");
  }
  await rm(outputRoot, { recursive: true, force: true });
  await rm(zipPath, { force: true });
  await mkdir(path.dirname(outputRoot), { recursive: true });
  await writePackageFiles(outputRoot, input.units);
  await validateSupplierSamplePackage({ folderPath: outputRoot, zipPath, expectedUnits: input.units });
  const zip = await buildZip(outputRoot, zipPath);
  await validateSupplierSamplePackage({ folderPath: outputRoot, zipPath, expectedUnits: input.units });
  return {
    folderPath: outputRoot,
    zipPath,
    zipChecksum: sha256(zip),
    zipSizeBytes: zip.length,
    files: await collectFiles(outputRoot),
    units: input.units,
  };
}

export async function prepareSupplierSamplePackageFromDatabase(input: {
  actorUserId?: string;
  recordProductionFile?: boolean;
  outputRoot?: string;
  zipPath?: string;
} = {}): Promise<SupplierSampleBuildResult> {
  const { batch, units } = await getSupplierSampleUnitsFromDatabase();
  const result = await buildSupplierSamplePackage({ units, outputRoot: input.outputRoot, zipPath: input.zipPath });
  let productionFileId: string | undefined;
  if (input.recordProductionFile) {
    const productionRoot = path.join(workspaceRoot, "data", "production", SUPPLIER_SAMPLE_BATCH_REFERENCE, "final-supplier-package");
    await mkdir(productionRoot, { recursive: true });
    const storagePath = path.join(productionRoot, `${SUPPLIER_SAMPLE_EXPORT_NAME}.zip`);
    const zip = await readFile(result.zipPath);
    await writeFile(storagePath, zip);
    const productionFile = await prisma.productionFile.create({
      data: {
        batchId: batch.id,
        type: ProductionFileType.FULL_PACKAGE_ZIP,
        filename: `${SUPPLIER_SAMPLE_EXPORT_NAME}.zip`,
        storagePath,
        checksum: result.zipChecksum,
        generatedBy: input.actorUserId,
        status: "READY",
        metadata: JSON.stringify({
          package: SUPPLIER_SAMPLE_EXPORT_NAME,
          publicCodes: units.map((unit) => unit.publicCode),
          secretCredentialsIncluded: false,
        }),
      },
    });
    productionFileId = productionFile.id;
    await prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        action: "SUPPLIER_SAMPLE_PACKAGE_PREPARED",
        entityType: "ProductionFile",
        entityId: productionFile.id,
        newData: JSON.stringify({
          batchId: batch.id,
          batchReference: batch.internalReference,
          filename: productionFile.filename,
          checksum: result.zipChecksum,
          zipSizeBytes: result.zipSizeBytes,
          publicCodes: units.map((unit) => unit.publicCode),
          secretCredentialsIncluded: false,
        }),
      },
    });
  }
  return { ...result, productionFileId };
}

function parseProductionCsv(csv: string) {
  const lines = csv.trim().split(/\r?\n/);
  return lines.map((line) => {
    const cells: string[] = [];
    let cell = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"' && quoted && line[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === "," && !quoted) {
        cells.push(cell);
        cell = "";
      } else {
        cell += char;
      }
    }
    cells.push(cell);
    return cells;
  });
}

async function readWorkbookRows(filePath: string, sheetIndex: number) {
  const zip = await JSZip.loadAsync(await readFile(filePath));
  const xml = await zip.file(`xl/worksheets/sheet${sheetIndex}.xml`)?.async("string");
  if (!xml) throw new Error(`Workbook missing sheet${sheetIndex}.xml`);
  const rows: string[][] = [];
  for (const rowMatch of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const row: string[] = [];
    for (const cellMatch of rowMatch[1].matchAll(/<t>([\s\S]*?)<\/t>/g)) {
      row.push(
        cellMatch[1]
          .replaceAll("&quot;", '"')
          .replaceAll("&apos;", "'")
          .replaceAll("&gt;", ">")
          .replaceAll("&lt;", "<")
          .replaceAll("&amp;", "&"),
      );
    }
    rows.push(row);
  }
  return rows;
}

async function validateChecksums(folderPath: string) {
  const checksumsPath = path.join(folderPath, "06-checksums-sha256.txt");
  const lines = (await readFile(checksumsPath, "utf8")).trim().split(/\r?\n/);
  const expectedFiles = (await collectFiles(folderPath)).filter((file) => file !== "06-checksums-sha256.txt").sort();
  const checksumFiles = lines.map((line) => line.replace(/^[a-f0-9]{64}\s+/, "")).sort();
  if (JSON.stringify(expectedFiles) !== JSON.stringify(checksumFiles)) throw new Error("Checksum file list mismatch.");
  for (const line of lines) {
    const match = line.match(/^([a-f0-9]{64})\s+(.+)$/);
    if (!match) throw new Error(`Invalid checksum line: ${line}`);
    const [, hash, relative] = match;
    const actual = sha256(await readFile(path.join(folderPath, relative)));
    if (actual !== hash) throw new Error(`Checksum mismatch for ${relative}.`);
  }
}

async function validateZip(zipPath: string, folderPath: string) {
  if (!existsSync(zipPath)) return;
  const zip = await JSZip.loadAsync(await readFile(zipPath));
  const entries = Object.values(zip.files)
    .filter((entry) => !entry.dir)
    .map((entry) => entry.name)
    .sort();
  const expected = (await collectFiles(folderPath)).map((file) => `${SUPPLIER_SAMPLE_EXPORT_NAME}/${file}`).sort();
  if (JSON.stringify(entries) !== JSON.stringify(expected)) throw new Error("ZIP structure mismatch.");
  const extractRoot = path.join(tmpdir(), `helplis-supplier-sample-${Date.now()}`);
  await rm(extractRoot, { recursive: true, force: true });
  for (const entry of Object.values(zip.files)) {
    if (entry.dir) continue;
    const target = path.join(extractRoot, entry.name);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, await entry.async("nodebuffer"));
  }
  await validateChecksums(path.join(extractRoot, SUPPLIER_SAMPLE_EXPORT_NAME));
  await rm(extractRoot, { recursive: true, force: true });
}

async function validateNoSecrets(folderPath: string) {
  const offenders: string[] = [];
  for (const relative of await collectFiles(folderPath)) {
    if (/\.(png|pdf|xlsx)$/i.test(relative)) continue;
    const text = await readFile(path.join(folderPath, relative), "utf8");
    if (secretPatterns.some((pattern) => pattern.test(text))) offenders.push(relative);
  }
  if (offenders.length) throw new Error(`Forbidden token found in package: ${offenders.join(", ")}`);
}

export async function validateSupplierSamplePackage(input: {
  folderPath?: string;
  zipPath?: string;
  expectedUnits?: SupplierSampleUnit[];
}) {
  const folderPath = input.folderPath ?? SUPPLIER_SAMPLE_EXPORT_ROOT;
  const zipPath = input.zipPath ?? SUPPLIER_SAMPLE_ZIP_PATH;
  if (!existsSync(folderPath)) throw new Error(`Package folder not found: ${folderPath}`);
  const folderStat = await stat(folderPath);
  if (!folderStat.isDirectory()) throw new Error("Package path is not a folder.");

  const files = await collectFiles(folderPath);
  if (JSON.stringify(files) !== JSON.stringify(requiredRelativeFiles)) throw new Error("Package file structure mismatch.");
  const units = input.expectedUnits ?? SUPPLIER_SAMPLE_PUBLIC_CODES.map((code, index) => ({
    wristbandReference: `W-${String(index + 1).padStart(3, "0")}`,
    publicCode: code,
    publicUrl: expectedUrl(code),
    qrContent: expectedUrl(code),
    nfcContent: expectedUrl(code),
    qrPngFilename: `${code}.png`,
    qrSvgFilename: `${code}.svg`,
    batchReference: SUPPLIER_SAMPLE_BATCH_REFERENCE,
  }));
  assertSupplierSampleUnits(units);

  const csvRows = parseProductionCsv(await readFile(path.join(folderPath, "02-production-data.csv"), "utf8"));
  if (JSON.stringify(csvRows) !== JSON.stringify(productionRows(units))) throw new Error("Production CSV content mismatch.");
  for (const row of csvRows.flat()) {
    if (/^[=+\-@]/.test(row)) throw new Error("Unsafe CSV cell detected.");
  }

  const workbookRows = await readWorkbookRows(path.join(folderPath, "01-production-data.xlsx"), 1);
  if (JSON.stringify(workbookRows) !== JSON.stringify(productionRows(units))) throw new Error("Production workbook content mismatch.");
  const returnRows = await readWorkbookRows(path.join(folderPath, "05-supplier-return-template.xlsx"), 1);
  if (JSON.stringify(returnRows) !== JSON.stringify(supplierReturnRows(units))) throw new Error("Supplier return workbook content mismatch.");

  for (const unit of units) {
    const pngPath = path.join(folderPath, "qr-png", unit.qrPngFilename);
    const svgPath = path.join(folderPath, "qr-svg", unit.qrSvgFilename);
    const pngDecoded = await decodeQrPng(await readFile(pngPath));
    const svg = await readFile(svgPath, "utf8");
    if (svg.includes("<script") || /href=["']https?:/i.test(svg)) throw new Error(`Unsafe SVG QR for ${unit.publicCode}.`);
    const svgDecoded = await decodeQrSvg(svg);
    if (pngDecoded !== unit.publicUrl || svgDecoded !== unit.publicUrl) {
      throw new Error(`QR content mismatch for ${unit.publicCode}.`);
    }
  }

  await validateChecksums(folderPath);
  await validateNoSecrets(folderPath);
  await validateZip(zipPath, folderPath);
  return {
    folderPath,
    zipPath,
    files,
    publicCodes: units.map((unit) => unit.publicCode),
    checksumsValid: true,
    qrValid: true,
    secretsClean: true,
  };
}
