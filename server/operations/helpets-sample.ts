import crypto from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { DeviceStatus, Prisma, ProductType } from "@prisma/client";
import JSZip from "jszip";
import QRCode from "qrcode";
import sharp from "sharp";
import { env } from "@/lib/env/server";
import { hashActivationCode } from "@/lib/security/hashing";
import { prisma } from "@/server/db/client";
import { buildPublicUrl, generateActivationCode, generatePublicCode } from "@/server/services/codes";
import { encryptActivationCode } from "./activation-code-vault";
import { escapeCsvCell, sha256 } from "./manufacturer-export";

export const HELPETS_SAMPLE_BATCH_REFERENCE = "SAMPLE-HELPETS-001";
export const HELPETS_SAMPLE_QUANTITY = 5;
export const HELPETS_SAMPLE_DOMAIN = "https://helplis.cl";
export const HELPETS_SIMPLE_EXPORT_NAME = "HELPETS-SAMPLE-001-SIMPLE";
export const HELPETS_INTERNAL_EXPORT_NAME = "HELPETS-SAMPLE-001-INTERNAL";

const HELPETS_PREVIEW_VERSION = 1 as const;
const HELPETS_PREVIEW_TTL_MS = 30 * 60 * 1_000;
const HELPETS_CODE_REGEX = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/;
const PERSONAS_SAMPLE_CODES = new Set(["SJRUPNZQ", "BCM3BLAJ", "H26EJYQW", "THAHHRYR", "TCR6MTJB"]);
const exportsRoot = path.join(/*turbopackIgnore: true*/ process.cwd(), "exports");

const helpetsInstructionLines = [
  "This order contains five unique Helpets pet tags.",
  "Each tag must have a different laser-engraved QR code.",
  "Each NFC chip must be programmed with the exact same URL as the QR code on that physical tag.",
  "QR and NFC must open the same Helpets/HelPlis URL.",
  "Do not modify, shorten, duplicate or exchange URLs.",
  "Lock the NFC after successful programming and testing.",
  "Send a digital mockup before production.",
  "Send one continuous video testing QR and NFC for all five tags before shipment.",
];

const messageToLeanne = `Hi Leanne,

Please find attached the production information for 5 functional Helpets sample pet tags.

The package includes:

1. An Excel file with 5 unique permanent URLs.
2. The Helpets front artwork in color and black versions.
3. The back layout with the QR position and the original HelPlis logo below the QR.

For each tag:

- The QR code must contain the exact URL assigned in the corresponding row.
- The NFC chip must contain the exact same URL.
- QR and NFC must open the same URL.
- Please lock the NFC after successful programming and testing.

Before production, please send us a digital rendering/mockup for approval.

Before shipment, please send one continuous video showing all 5 tags individually:

1. Scan the QR.
2. Scan the NFC.
3. Confirm that both open the same URL.

Please do not begin production until we approve the final rendering.

Thank you.
`;

export const helpetsConfirmationErrorCodes = [
  "BATCH_REFERENCE_ALREADY_EXISTS",
  "PUBLIC_CODE_COLLISION",
  "INVALID_PREVIEW",
  "PREVIEW_EXPIRED",
  "DATABASE_CONSTRAINT_ERROR",
  "DATABASE_CONNECTION_ERROR",
  "MIGRATION_MISMATCH",
  "UNAUTHORIZED",
  "UNKNOWN_CONFIRMATION_ERROR",
] as const;

export type HelpetsConfirmationErrorCode = (typeof helpetsConfirmationErrorCodes)[number];

export class HelpetsSampleConfirmationError extends Error {
  constructor(
    public readonly code: HelpetsConfirmationErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "HelpetsSampleConfirmationError";
  }
}

export type HelpetsSamplePreviewUnit = {
  tagReference: string;
  publicCode: string;
  publicUrl: string;
  qrUrl: string;
  nfcUrl: string;
  qrContent: string;
  nfcContent: string;
  qrFilename: string;
  batchReference: typeof HELPETS_SAMPLE_BATCH_REFERENCE;
  productLine: "HELPETS";
  profileType: "PET";
  deviceType: "PET_TAG";
  productionMode: "SAMPLE";
  initialState: "UNACTIVATED";
  inventoryInitialState: "UNASSIGNED";
};

export type HelpetsSamplePreview = {
  internalReference: typeof HELPETS_SAMPLE_BATCH_REFERENCE;
  quantity: typeof HELPETS_SAMPLE_QUANTITY;
  domain: typeof HELPETS_SAMPLE_DOMAIN;
  productLine: "HELPETS";
  profileType: "PET";
  deviceType: "PET_TAG";
  productionMode: "SAMPLE";
  units: HelpetsSamplePreviewUnit[];
};

type HelpetsPackageFile = {
  path: string;
  data: Buffer | string;
};

type SignedHelpetsPreviewPayload = {
  version: typeof HELPETS_PREVIEW_VERSION;
  expiresAt: string;
  units: HelpetsSamplePreviewUnit[];
  signature: string;
};

function helpetsPreviewSignature(payload: Omit<SignedHelpetsPreviewPayload, "signature">) {
  return crypto.createHmac("sha256", env.AUTH_SECRET).update(JSON.stringify(payload)).digest("base64url");
}

function isHelpetsConfirmationError(error: unknown): error is HelpetsSampleConfirmationError {
  return error instanceof HelpetsSampleConfirmationError;
}

export function helpetsConfirmationCodeForError(error: unknown): HelpetsConfirmationErrorCode {
  if (isHelpetsConfirmationError(error)) return error.code;

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P1001" || error.code === "P1002" || error.code === "P2024") {
      return "DATABASE_CONNECTION_ERROR";
    }
    if (error.code === "P2021" || error.code === "P2022") {
      return "MIGRATION_MISMATCH";
    }
    if (error.code === "P2002") {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(",") : String(error.meta?.target ?? "");
      if (target.includes("internalReference")) return "BATCH_REFERENCE_ALREADY_EXISTS";
      if (target.includes("publicCode") || target.includes("publicUrl") || target.includes("nfcUid")) {
        return "PUBLIC_CODE_COLLISION";
      }
      return "DATABASE_CONSTRAINT_ERROR";
    }
    if (["P2000", "P2003", "P2011", "P2014"].includes(error.code)) {
      return "DATABASE_CONSTRAINT_ERROR";
    }
  }

  return "UNKNOWN_CONFIRMATION_ERROR";
}

export function helpetsMessageToLeanne() {
  return messageToLeanne;
}

export function helpetsSupplierInstructions() {
  return helpetsInstructionLines.join("\n");
}

export async function buildHelpetsSamplePreview(): Promise<HelpetsSamplePreview> {
  const seen = new Set<string>();
  const units: HelpetsSamplePreviewUnit[] = [];

  while (units.length < HELPETS_SAMPLE_QUANTITY) {
    const publicCode = generatePublicCode(8);
    if (seen.has(publicCode) || PERSONAS_SAMPLE_CODES.has(publicCode) || !HELPETS_CODE_REGEX.test(publicCode)) continue;
    const existing = await prisma.device.findUnique({ where: { publicCode } });
    if (existing) continue;
    seen.add(publicCode);

    const publicUrl = buildPublicUrl(publicCode, HELPETS_SAMPLE_DOMAIN);
    const index = units.length + 1;
    units.push({
      tagReference: `P-${String(index).padStart(3, "0")}`,
      publicCode,
      publicUrl,
      qrUrl: publicUrl,
      nfcUrl: publicUrl,
      qrContent: publicUrl,
      nfcContent: publicUrl,
      qrFilename: `P-${String(index).padStart(3, "0")}-${publicCode}.svg`,
      batchReference: HELPETS_SAMPLE_BATCH_REFERENCE,
      productLine: "HELPETS",
      profileType: "PET",
      deviceType: "PET_TAG",
      productionMode: "SAMPLE",
      initialState: "UNACTIVATED",
      inventoryInitialState: "UNASSIGNED",
    });
  }

  return {
    internalReference: HELPETS_SAMPLE_BATCH_REFERENCE,
    quantity: HELPETS_SAMPLE_QUANTITY,
    domain: HELPETS_SAMPLE_DOMAIN,
    productLine: "HELPETS",
    profileType: "PET",
    deviceType: "PET_TAG",
    productionMode: "SAMPLE",
    units,
  };
}

export async function getConfirmedHelpetsSampleBatch() {
  const batch = await prisma.batch.findUnique({
    where: { internalReference: HELPETS_SAMPLE_BATCH_REFERENCE },
    include: {
      devices: {
        orderBy: { internalSequence: "asc" },
        select: {
          internalSequence: true,
          publicCode: true,
          publicUrl: true,
          qrContent: true,
          nfcContent: true,
          status: true,
          productionStatus: true,
          inventoryStatus: true,
        },
      },
    },
  });
  if (!batch) return null;

  return {
    id: batch.id,
    internalReference: batch.internalReference,
    quantity: batch.quantity,
    productionMode: batch.productionMode,
    status: batch.status,
    productType: batch.productType,
    createdAt: batch.createdAt,
    units: batch.devices.map((device, index) => {
      const publicUrl = device.publicUrl;
      return {
        tagReference: `P-${String(device.internalSequence ?? index + 1).padStart(3, "0")}`,
        publicCode: device.publicCode,
        publicUrl,
        qrUrl: publicUrl,
        nfcUrl: publicUrl,
        qrContent: device.qrContent ?? publicUrl,
        nfcContent: device.nfcContent ?? publicUrl,
        qrFilename: `P-${String(device.internalSequence ?? index + 1).padStart(3, "0")}-${device.publicCode}.svg`,
        batchReference: HELPETS_SAMPLE_BATCH_REFERENCE as typeof HELPETS_SAMPLE_BATCH_REFERENCE,
        productLine: "HELPETS" as const,
        profileType: "PET" as const,
        deviceType: "PET_TAG" as const,
        productionMode: "SAMPLE" as const,
        initialState: "UNACTIVATED" as const,
        inventoryInitialState: "UNASSIGNED" as const,
        persistedStatus: device.status,
        productionStatus: device.productionStatus,
        inventoryStatus: device.inventoryStatus,
      };
    }),
  };
}

export function encodeHelpetsSampleUnits(
  units: HelpetsSamplePreviewUnit[],
  options: { now?: Date; ttlMs?: number } = {},
) {
  const now = options.now ?? new Date();
  const payloadWithoutSignature = {
    version: HELPETS_PREVIEW_VERSION,
    expiresAt: new Date(now.getTime() + (options.ttlMs ?? HELPETS_PREVIEW_TTL_MS)).toISOString(),
    units,
  };
  const payload: SignedHelpetsPreviewPayload = {
    ...payloadWithoutSignature,
    signature: helpetsPreviewSignature(payloadWithoutSignature),
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  assertHelpetsPreviewNeverExposesActivation(encoded);
  return encoded;
}

export function decodeHelpetsSampleUnits(value: string, options: { now?: Date } = {}): HelpetsSamplePreviewUnit[] {
  if (!value) {
    throw new HelpetsSampleConfirmationError("INVALID_PREVIEW", "Missing Helpets preview payload.");
  }

  let parsed: SignedHelpetsPreviewPayload;
  try {
    parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as SignedHelpetsPreviewPayload;
  } catch (error) {
    throw new HelpetsSampleConfirmationError("INVALID_PREVIEW", "Malformed Helpets preview payload.", error);
  }

  const { signature, ...unsignedPayload } = parsed;
  const expectedSignature = helpetsPreviewSignature(unsignedPayload);
  const signatureBuffer = Buffer.from(signature ?? "");
  const expectedSignatureBuffer = Buffer.from(expectedSignature);
  if (
    parsed.version !== HELPETS_PREVIEW_VERSION ||
    !signature ||
    signatureBuffer.length !== expectedSignatureBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
  ) {
    throw new HelpetsSampleConfirmationError("INVALID_PREVIEW", "Invalid Helpets preview signature.");
  }

  if (new Date(parsed.expiresAt).getTime() <= (options.now ?? new Date()).getTime()) {
    throw new HelpetsSampleConfirmationError("PREVIEW_EXPIRED", "Helpets preview expired.");
  }

  if (!Array.isArray(parsed.units) || parsed.units.length !== HELPETS_SAMPLE_QUANTITY) {
    throw new HelpetsSampleConfirmationError("INVALID_PREVIEW", "Invalid Helpets preview quantity.");
  }

  const seen = new Set<string>();
  return parsed.units.map((unit, index) => {
    const validated = validateHelpetsPreviewUnit(unit, index);
    if (seen.has(validated.publicCode)) {
      throw new HelpetsSampleConfirmationError("INVALID_PREVIEW", "Duplicate Helpets public code in preview.");
    }
    seen.add(validated.publicCode);
    return validated;
  });
}

export function assertHelpetsPreviewNeverExposesActivation(payload: string) {
  if (/activationCode/i.test(payload)) {
    throw new HelpetsSampleConfirmationError("INVALID_PREVIEW", "Helpets preview payload exposes activation data.");
  }
}

function validateHelpetsPreviewUnit(unit: HelpetsSamplePreviewUnit, index: number): HelpetsSamplePreviewUnit {
  const publicCode = String(unit.publicCode ?? "").trim().toUpperCase();
  const publicUrl = buildPublicUrl(publicCode, HELPETS_SAMPLE_DOMAIN);
  const tagReference = `P-${String(index + 1).padStart(3, "0")}`;

  if (!HELPETS_CODE_REGEX.test(publicCode) || PERSONAS_SAMPLE_CODES.has(publicCode)) {
    throw new HelpetsSampleConfirmationError("INVALID_PREVIEW", "Invalid Helpets public code.");
  }
  if (
    unit.publicUrl !== publicUrl ||
    unit.qrUrl !== publicUrl ||
    unit.nfcUrl !== publicUrl ||
    unit.qrContent !== publicUrl ||
    unit.nfcContent !== publicUrl
  ) {
    throw new HelpetsSampleConfirmationError("INVALID_PREVIEW", "Invalid Helpets permanent URL mapping.");
  }
  if (
    unit.batchReference !== HELPETS_SAMPLE_BATCH_REFERENCE ||
    unit.productLine !== "HELPETS" ||
    unit.profileType !== "PET" ||
    unit.deviceType !== "PET_TAG" ||
    unit.productionMode !== "SAMPLE" ||
    unit.initialState !== "UNACTIVATED" ||
    unit.inventoryInitialState !== "UNASSIGNED"
  ) {
    throw new HelpetsSampleConfirmationError("INVALID_PREVIEW", "Invalid Helpets preview metadata.");
  }

  return {
    tagReference,
    publicCode,
    publicUrl,
    qrUrl: publicUrl,
    nfcUrl: publicUrl,
    qrContent: publicUrl,
    nfcContent: publicUrl,
    qrFilename: `${tagReference}-${publicCode}.svg`,
    batchReference: HELPETS_SAMPLE_BATCH_REFERENCE,
    productLine: "HELPETS",
    profileType: "PET",
    deviceType: "PET_TAG",
    productionMode: "SAMPLE",
    initialState: "UNACTIVATED",
    inventoryInitialState: "UNASSIGNED",
  };
}

const helpetsColumns = ["Tag Reference", "Public Code", "Public URL", "QR URL", "NFC URL", "Batch Reference"] as const;

function helpetsRows(units: HelpetsSamplePreviewUnit[]) {
  return units.map((unit) => [
    unit.tagReference,
    unit.publicCode,
    unit.publicUrl,
    unit.qrUrl,
    unit.nfcUrl,
    unit.batchReference,
  ]);
}

export function buildHelpetsProductionDataCsv(units: HelpetsSamplePreviewUnit[]) {
  return [
    helpetsColumns.map(escapeCsvCell).join(","),
    ...helpetsRows(units).map((row) => row.map(escapeCsvCell).join(",")),
  ].join("\n");
}

export function buildHelpetsSupplierReturnTemplateCsv(units: HelpetsSamplePreviewUnit[]) {
  const header = ["Tag Reference", "Public Code", "Public URL", "NFC UID", "QR Test Result", "NFC Test Result", "Notes"];
  const rows = units.map((unit) => [unit.tagReference, unit.publicCode, unit.publicUrl, "", "", "", ""]);
  return [header, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\n");
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
          return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(String(cellValue ?? ""))}</t></is></c>`;
        })
        .join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${body}</sheetData></worksheet>`;
}

export async function buildHelpetsWorkbookBuffer(units: HelpetsSamplePreviewUnit[]) {
  const zip = new JSZip();
  const productionRows = [Array.from(helpetsColumns), ...helpetsRows(units)];
  const instructionRows = helpetsInstructionLines.map((line) => [line]);

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
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/"><dc:title>Helpets sample production data</dc:title><dc:creator>HelPlis</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">${new Date().toISOString()}</dcterms:created></cp:coreProperties>`,
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

function assetPath(...segments: string[]) {
  return path.join(/*turbopackIgnore: true*/ process.cwd(), ...segments);
}

async function readTextAsset(...segments: string[]) {
  return readFile(assetPath(...segments), "utf8");
}

async function readBufferAsset(...segments: string[]) {
  return readFile(assetPath(...segments));
}

function blackenSvg(svg: string, title: string) {
  return svg
    .replace(/<defs>[\s\S]*?<\/defs>/g, "")
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeXml(title)}</title>`)
    .replace(/fill="url\([^"]+\)"/g, 'fill="#000000"')
    .replace(/fill="#[0-9A-Fa-f]{3,6}"/g, 'fill="#000000"')
    .replace(/stop-color="#[0-9A-Fa-f]{3,6}"/g, 'stop-color="#000000"');
}

function extractSvgBody(svg: string) {
  const match = svg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
  return match?.[1]?.replace(/<title>[\s\S]*?<\/title>/g, "").replace(/<defs>[\s\S]*?<\/defs>/g, "") ?? svg;
}

async function buildFrontLogoColorSvg() {
  return readTextAsset("branding", "pets", "logo-colorized", "svg", "helpets-vertical-slogan-color.svg");
}

async function buildFrontLogoBlackSvg() {
  return blackenSvg(await buildFrontLogoColorSvg(), "Helpets vertical black with slogan");
}

async function buildBackLayoutSvg() {
  const textSvg = await readTextAsset("branding", "pets", "text", "escanea-para-ayudar-curvas.svg");
  const helplisSvg = await readTextAsset("public", "brand", "vector", "helplis_logo_vector.svg");
  const textBody = blackenSvg(extractSvgBody(textSvg), "Escanea para ayudar");
  const helplisBody = blackenSvg(extractSvgBody(helplisSvg), "HelPlis logo");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760" role="img" aria-label="Helpets back layout with HelPlis logo">
  <title>Helpets back layout</title>
  <rect width="1200" height="760" rx="72" fill="#ffffff"/>
  <rect x="44" y="44" width="1112" height="672" rx="56" fill="none" stroke="#000000" stroke-width="8" stroke-dasharray="24 18"/>
  <g transform="translate(242 86) scale(1.7)">
    ${textBody}
  </g>
  <rect x="390" y="228" width="420" height="420" fill="#ffffff" stroke="#000000" stroke-width="12"/>
  <rect x="430" y="268" width="82" height="82" fill="#000000"/>
  <rect x="688" y="268" width="82" height="82" fill="#000000"/>
  <rect x="430" y="526" width="82" height="82" fill="#000000"/>
  <rect x="548" y="386" width="44" height="44" fill="#000000"/>
  <rect x="616" y="386" width="44" height="44" fill="#000000"/>
  <rect x="548" y="454" width="112" height="44" fill="#000000"/>
  <text x="600" y="676" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="700" fill="#000000">VARIABLE QR - REPLACE PER TAG</text>
  <g transform="translate(410 692) scale(0.38)">
    ${helplisBody}
  </g>
</svg>`;
}

async function svgPreviewPng(svg: string, width = 1200) {
  return sharp(Buffer.from(svg)).resize({ width }).png().toBuffer();
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function vectorReferencePdf(input: { title: string; subtitle: string; lines: string[]; color?: [number, number, number] }) {
  const color = input.color ?? [0, 0, 0];
  const streamLines = [
    "q",
    `${color[0]} ${color[1]} ${color[2]} rg`,
    "72 650 468 1 re f",
    "BT /F1 34 Tf 72 600 Td",
    `(${escapePdfText(input.title)}) Tj`,
    "0 -42 Td /F1 18 Tf",
    `(${escapePdfText(input.subtitle)}) Tj`,
    "0 -54 Td /F1 13 Tf",
    ...input.lines.flatMap((line) => [`(${escapePdfText(line)}) Tj`, "0 -22 Td"]),
    "ET",
    "Q",
  ];
  return buildPdfFromContent(streamLines.join("\n"), { width: 612, height: 792 });
}

function buildPdfFromContent(content: string, page: { width: number; height: number }) {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${page.width} ${page.height}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`,
  ];
  let offset = 0;
  const chunks = ["%PDF-1.4\n"];
  offset += Buffer.byteLength(chunks[0], "utf8");
  const xref = ["0000000000 65535 f "];

  objects.forEach((object, index) => {
    xref.push(`${String(offset).padStart(10, "0")} 00000 n `);
    const chunk = `${index + 1} 0 obj\n${object}\nendobj\n`;
    chunks.push(chunk);
    offset += Buffer.byteLength(chunk, "utf8");
  });

  const trailer = `xref\n0 ${objects.length + 1}\n${xref.join("\n")}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF\n`;
  chunks.push(trailer);
  return Buffer.from(chunks.join(""), "utf8");
}

async function buildSimplePackageFiles(units: HelpetsSamplePreviewUnit[]) {
  const frontColorSvg = await buildFrontLogoColorSvg();
  const frontBlackSvg = await buildFrontLogoBlackSvg();
  const backLayoutSvg = await buildBackLayoutSvg();
  const frontColorPdf = await readBufferAsset("branding", "pets", "logo-colorized", "pdf", "helpets-vertical-slogan-color.pdf");
  const frontBlackPdf = vectorReferencePdf({
    title: "Helpets",
    subtitle: "Protege. Conecta. Tranquiliza.",
    lines: ["One-color black artwork reference.", "Use 05-helpets-front-logo-black.svg as the engraving vector source."],
  });
  const backLayoutPdf = vectorReferencePdf({
    title: "Escanea para ayudar",
    subtitle: "Back layout with variable QR placeholder",
    lines: [
      "Large QR placeholder centered.",
      "VARIABLE QR - REPLACE PER TAG",
      "Original HelPlis logo below QR.",
      "Use 08-helpets-back-layout.svg as the engraving vector source.",
    ],
  });

  return [
    { path: "01-helpets-5-urls.xlsx", data: await buildHelpetsWorkbookBuffer(units) },
    { path: "02-helpets-5-urls.csv", data: buildHelpetsProductionDataCsv(units) },
    { path: "03-helpets-front-logo-color.pdf", data: frontColorPdf },
    { path: "04-helpets-front-logo-black.pdf", data: frontBlackPdf },
    { path: "05-helpets-front-logo-color.svg", data: frontColorSvg },
    { path: "06-helpets-front-logo-black.svg", data: frontBlackSvg },
    { path: "07-helpets-back-layout.pdf", data: backLayoutPdf },
    { path: "08-helpets-back-layout.svg", data: backLayoutSvg },
    { path: "09-message-to-leanne.txt", data: messageToLeanne },
  ] satisfies HelpetsPackageFile[];
}

export async function buildHelpetsSimplePackageFiles(units: HelpetsSamplePreviewUnit[]) {
  return buildSimplePackageFiles(units);
}

async function buildQrPackageFiles(units: HelpetsSamplePreviewUnit[], format: "png" | "svg") {
  const files: HelpetsPackageFile[] = [];
  for (const unit of units) {
    if (format === "png") {
      const png = await QRCode.toBuffer(unit.qrContent, {
        type: "png",
        margin: 4,
        width: 1024,
        errorCorrectionLevel: "M",
      });
      files.push({ path: `qr-png/${unit.tagReference}-${unit.publicCode}.png`, data: png });
    } else {
      const svg = await QRCode.toString(unit.qrContent, {
        type: "svg",
        margin: 4,
        width: 1024,
        errorCorrectionLevel: "M",
      });
      files.push({ path: `qr-svg/${unit.tagReference}-${unit.publicCode}.svg`, data: svg });
    }
  }
  return files;
}

export async function buildHelpetsInternalPackageFiles(units: HelpetsSamplePreviewUnit[]) {
  const simpleFiles = await buildSimplePackageFiles(units);
  const frontColorSvg = String(simpleFiles.find((file) => file.path === "05-helpets-front-logo-color.svg")?.data ?? "");
  const frontBlackSvg = String(simpleFiles.find((file) => file.path === "06-helpets-front-logo-black.svg")?.data ?? "");
  const backLayoutSvg = String(simpleFiles.find((file) => file.path === "08-helpets-back-layout.svg")?.data ?? "");
  const qrPngFiles = await buildQrPackageFiles(units, "png");
  const qrSvgFiles = await buildQrPackageFiles(units, "svg");
  const manifest = JSON.stringify(
    {
      batchReference: HELPETS_SAMPLE_BATCH_REFERENCE,
      productLine: "HELPETS",
      profileType: "PET",
      deviceType: "PET_TAG",
      productionMode: "SAMPLE",
      quantity: HELPETS_SAMPLE_QUANTITY,
      generatedAt: new Date().toISOString(),
      persisted: false,
      secretCredentialsIncluded: false,
      publicUrlEqualsQrAndNfc: true,
      personasBatchReferenceUntouched: "SAMPLE-HELPLIS-001",
      supplierSimpleZip: `${HELPETS_SIMPLE_EXPORT_NAME}.zip`,
      internalZip: `${HELPETS_INTERNAL_EXPORT_NAME}.zip`,
      publicCodes: units.map((unit) => unit.publicCode),
    },
    null,
    2,
  );

  const files: HelpetsPackageFile[] = [
    ...simpleFiles.map((file) => ({ path: `simple/${file.path}`, data: file.data })),
    { path: "production-data/01-helpets-5-urls.xlsx", data: await buildHelpetsWorkbookBuffer(units) },
    { path: "production-data/02-helpets-5-urls.csv", data: buildHelpetsProductionDataCsv(units) },
    { path: "instructions/instructions-en.txt", data: helpetsSupplierInstructions() },
    { path: "instructions/message-to-leanne.txt", data: messageToLeanne },
    { path: "supplier-return/supplier-return-template.csv", data: buildHelpetsSupplierReturnTemplateCsv(units) },
    { path: "layouts/front-logo-color.svg", data: frontColorSvg },
    { path: "layouts/front-logo-black.svg", data: frontBlackSvg },
    { path: "layouts/back-layout.svg", data: backLayoutSvg },
    { path: "layouts/previews/front-logo-color.png", data: await svgPreviewPng(frontColorSvg, 1200) },
    { path: "layouts/previews/front-logo-black.png", data: await svgPreviewPng(frontBlackSvg, 1200) },
    { path: "layouts/previews/back-layout.png", data: await svgPreviewPng(backLayoutSvg, 1200) },
    { path: "validations/manifest.json", data: manifest },
    ...qrPngFiles,
    ...qrSvgFiles,
  ];

  return files;
}

async function buildZip(files: HelpetsPackageFile[]) {
  const zip = new JSZip();
  for (const file of files) {
    zip.file(file.path, file.data);
  }
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

export async function buildHelpetsSimplePackageZip(units: HelpetsSamplePreviewUnit[]) {
  return buildZip(await buildSimplePackageFiles(units));
}

export async function buildHelpetsInternalPackageZip(units: HelpetsSamplePreviewUnit[]) {
  const files = await buildHelpetsInternalPackageFiles(units);
  const checksums = files.map((file) => `${sha256(file.data)}  ${file.path}`).join("\n");
  return buildZip([...files, { path: "checksums-sha256.txt", data: checksums }]);
}

export async function buildHelpetsChecksumsText(units: HelpetsSamplePreviewUnit[], packageKind: "simple" | "internal") {
  const files =
    packageKind === "simple" ? await buildSimplePackageFiles(units) : await buildHelpetsInternalPackageFiles(units);
  return files.map((file) => `${sha256(file.data)}  ${file.path}`).join("\n");
}

export async function prepareHelpetsSamplePackages(units?: HelpetsSamplePreviewUnit[]) {
  const previewUnits = units ?? (await buildHelpetsSamplePreview()).units;
  const simpleDirectory = path.join(exportsRoot, HELPETS_SIMPLE_EXPORT_NAME);
  const internalDirectory = path.join(exportsRoot, HELPETS_INTERNAL_EXPORT_NAME);
  const simpleZipPath = path.join(exportsRoot, `${HELPETS_SIMPLE_EXPORT_NAME}.zip`);
  const internalZipPath = path.join(exportsRoot, `${HELPETS_INTERNAL_EXPORT_NAME}.zip`);

  for (const directory of [simpleDirectory, internalDirectory]) {
    await rm(directory, { recursive: true, force: true });
    await mkdir(directory, { recursive: true });
  }
  await mkdir(exportsRoot, { recursive: true });

  const simpleFiles = await buildSimplePackageFiles(previewUnits);
  const internalFiles = await buildHelpetsInternalPackageFiles(previewUnits);
  const internalChecksums = internalFiles.map((file) => `${sha256(file.data)}  ${file.path}`).join("\n");

  for (const file of simpleFiles) {
    const outputPath = path.join(simpleDirectory, file.path);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, file.data);
  }
  for (const file of [...internalFiles, { path: "checksums-sha256.txt", data: internalChecksums }]) {
    const outputPath = path.join(internalDirectory, file.path);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, file.data);
  }

  await writeFile(simpleZipPath, await buildHelpetsSimplePackageZip(previewUnits));
  await writeFile(internalZipPath, await buildHelpetsInternalPackageZip(previewUnits));

  return {
    units: previewUnits,
    simpleDirectory,
    internalDirectory,
    simpleZipPath,
    internalZipPath,
  };
}

export async function confirmHelpetsSamplePreviewBatch(input: {
  encodedUnits: string;
  actorUserId?: string;
  confirmedIrreversible?: boolean;
}) {
  const units = decodeHelpetsSampleUnits(input.encodedUnits);
  assertHelpetsPreviewNeverExposesActivation(input.encodedUnits);
  if (!input.confirmedIrreversible) {
    throw new HelpetsSampleConfirmationError("INVALID_PREVIEW", "Irreversible confirmation is required.");
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const existingBatch = await tx.batch.findUnique({ where: { internalReference: HELPETS_SAMPLE_BATCH_REFERENCE } });
      if (existingBatch) {
        throw new HelpetsSampleConfirmationError("BATCH_REFERENCE_ALREADY_EXISTS", "Helpets sample batch already exists.");
      }

      const existingDevices = await tx.device.findMany({
        where: { publicCode: { in: units.map((unit) => unit.publicCode) } },
        select: { publicCode: true },
      });
      if (existingDevices.length) {
        throw new HelpetsSampleConfirmationError("PUBLIC_CODE_COLLISION", "Helpets sample public code already exists.");
      }

      const batch = await tx.batch.create({
        data: {
          internalReference: HELPETS_SAMPLE_BATCH_REFERENCE,
          supplierName: "Leanne",
          productType: ProductType.PET_TAG,
          productModel: "Helpets sample pet tag",
          chipType: "NFC pet tag",
          domain: HELPETS_SAMPLE_DOMAIN,
          productionMode: "SAMPLE",
          quantity: HELPETS_SAMPLE_QUANTITY,
          status: "AWAITING_QUOTE",
          notes:
            "Helpets SAMPLE real de 5 placas. No generar 500, no enviar al proveedor y no mezclar con SAMPLE-HELPLIS-001.",
          createdBy: input.actorUserId,
        },
      });

      for (const [index, unit] of units.entries()) {
        const activationCode = generateActivationCode(14);
        await tx.device.create({
          data: {
            internalSequence: index + 1,
            publicCode: unit.publicCode,
            publicUrl: unit.publicUrl,
            qrContent: unit.qrContent,
            nfcContent: unit.nfcContent,
            activationCodeHash: await hashActivationCode(activationCode),
            activationCodeEncrypted: encryptActivationCode(activationCode),
            batchId: batch.id,
            productType: ProductType.PET_TAG,
            status: DeviceStatus.UNASSIGNED,
            productionStatus: "CODES_GENERATED",
            verificationStatus: "PENDING",
            inventoryStatus: "IN_PRODUCTION",
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: input.actorUserId,
          action: "HELPETS_SAMPLE_BATCH_CONFIRMED",
          entityType: "Batch",
          entityId: batch.id,
          newData: JSON.stringify({
            internalReference: batch.internalReference,
            quantity: batch.quantity,
            productionMode: batch.productionMode,
            productType: batch.productType,
            productLine: "HELPETS",
            profileType: "PET",
            deviceType: "PET_TAG",
            publicCodes: units.map((unit) => unit.publicCode),
            secretCredentialsIncluded: false,
          }),
        },
      });

      return batch;
    });
  } catch (error) {
    if (isHelpetsConfirmationError(error)) throw error;
    throw new HelpetsSampleConfirmationError(
      helpetsConfirmationCodeForError(error),
      "Helpets sample confirmation failed.",
      error,
    );
  }
}
