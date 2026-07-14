import crypto from "node:crypto";
import { DeviceStatus, Prisma, ProductType } from "@prisma/client";
import JSZip from "jszip";
import QRCode from "qrcode";
import { env } from "@/lib/env/server";
import { hashActivationCode } from "@/lib/security/hashing";
import { prisma } from "@/server/db/client";
import { buildPublicUrl, generateActivationCode, generatePublicCode } from "@/server/services/codes";
import { encryptActivationCode } from "./activation-code-vault";
import {
  manufacturerInstructionsEn,
  rowsToCsv,
  rowsToWorkbookBuffer,
  sha256,
  type ProductionExportRow,
} from "./manufacturer-export";

export const SAMPLE_BATCH_REFERENCE = "SAMPLE-HELPLIS-001";
export const SAMPLE_BATCH_QUANTITY = 5;
export const SAMPLE_BATCH_DOMAIN = "https://helplis.cl";
const SAMPLE_PREVIEW_VERSION = 1 as const;
const SAMPLE_PREVIEW_TTL_MS = 30 * 60 * 1_000;

export const sampleConfirmationErrorCodes = [
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

export type SampleConfirmationErrorCode = (typeof sampleConfirmationErrorCodes)[number];

export class SampleBatchConfirmationError extends Error {
  constructor(
    public readonly code: SampleConfirmationErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "SampleBatchConfirmationError";
  }
}

export type SampleBatchPreviewUnit = {
  wristbandReference: string;
  publicCode: string;
  publicUrl: string;
  qrContent: string;
  nfcContent: string;
  qrFilename: string;
  batchReference: string;
  initialState: "UNACTIVATED";
};

type SignedSamplePreviewPayload = {
  version: typeof SAMPLE_PREVIEW_VERSION;
  expiresAt: string;
  units: SampleBatchPreviewUnit[];
  signature: string;
};

export type SampleBatchPreview = {
  internalReference: typeof SAMPLE_BATCH_REFERENCE;
  quantity: typeof SAMPLE_BATCH_QUANTITY;
  domain: typeof SAMPLE_BATCH_DOMAIN;
  productionMode: "SAMPLE";
  exportFormat: "XLSX + QR SVG + QR PNG + supplier return template";
  units: SampleBatchPreviewUnit[];
};

type SamplePackageFile = {
  path: string;
  data: Buffer | string;
};

function samplePreviewSignature(payload: Omit<SignedSamplePreviewPayload, "signature">) {
  return crypto.createHmac("sha256", env.AUTH_SECRET).update(JSON.stringify(payload)).digest("base64url");
}

function isSampleBatchConfirmationError(error: unknown): error is SampleBatchConfirmationError {
  return error instanceof SampleBatchConfirmationError;
}

export function sampleConfirmationCodeForError(error: unknown): SampleConfirmationErrorCode {
  if (isSampleBatchConfirmationError(error)) return error.code;

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
      if (target.includes("publicCode") || target.includes("publicUrl")) return "PUBLIC_CODE_COLLISION";
      return "DATABASE_CONSTRAINT_ERROR";
    }
    if (["P2000", "P2003", "P2011", "P2014"].includes(error.code)) {
      return "DATABASE_CONSTRAINT_ERROR";
    }
  }

  return "UNKNOWN_CONFIRMATION_ERROR";
}

export function assertSampleConfirmationNeverExposeActivation(payload: string) {
  if (/activationCode/i.test(payload)) {
    throw new SampleBatchConfirmationError("INVALID_PREVIEW", "Sample preview payload exposes activation data.");
  }
}

export async function buildSampleBatchPreview(): Promise<SampleBatchPreview> {
  const seen = new Set<string>();
  const units: SampleBatchPreviewUnit[] = [];

  while (units.length < SAMPLE_BATCH_QUANTITY) {
    const publicCode = generatePublicCode(8);
    if (seen.has(publicCode) || /^HLP\d+$/i.test(publicCode)) continue;
    const existing = await prisma.device.findUnique({ where: { publicCode } });
    if (existing) continue;
    seen.add(publicCode);

    const publicUrl = buildPublicUrl(publicCode, SAMPLE_BATCH_DOMAIN);
    const index = units.length + 1;
    units.push({
      wristbandReference: `W-${String(index).padStart(3, "0")}`,
      publicCode,
      publicUrl,
      qrContent: publicUrl,
      nfcContent: publicUrl,
      qrFilename: `${publicCode}.svg`,
      batchReference: SAMPLE_BATCH_REFERENCE,
      initialState: "UNACTIVATED",
    });
  }

  return {
    internalReference: SAMPLE_BATCH_REFERENCE,
    quantity: SAMPLE_BATCH_QUANTITY,
    domain: SAMPLE_BATCH_DOMAIN,
    productionMode: "SAMPLE",
    exportFormat: "XLSX + QR SVG + QR PNG + supplier return template",
    units,
  };
}

export function sampleUnitsToProductionRows(units: SampleBatchPreviewUnit[]): ProductionExportRow[] {
  return units.map((unit) => ({
    wristband_reference: unit.wristbandReference,
    public_code: unit.publicCode,
    public_url: unit.publicUrl,
    qr_content: unit.qrContent,
    nfc_content: unit.nfcContent,
    qr_filename: unit.qrFilename,
    batch_reference: unit.batchReference,
    product_type: "WRISTBAND",
  }));
}

export function encodeSampleUnits(
  units: SampleBatchPreviewUnit[],
  options: { now?: Date; ttlMs?: number } = {},
) {
  const now = options.now ?? new Date();
  const payloadWithoutSignature = {
    version: SAMPLE_PREVIEW_VERSION,
    expiresAt: new Date(now.getTime() + (options.ttlMs ?? SAMPLE_PREVIEW_TTL_MS)).toISOString(),
    units,
  };
  const payload: SignedSamplePreviewPayload = {
    ...payloadWithoutSignature,
    signature: samplePreviewSignature(payloadWithoutSignature),
  };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeSampleUnits(
  value: string,
  options: { now?: Date; batchReference?: string } = {},
): SampleBatchPreviewUnit[] {
  if (!value) {
    throw new SampleBatchConfirmationError("INVALID_PREVIEW", "Missing sample preview payload.");
  }

  let parsed: SignedSamplePreviewPayload;
  try {
    parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as SignedSamplePreviewPayload;
  } catch (error) {
    throw new SampleBatchConfirmationError("INVALID_PREVIEW", "Malformed sample preview payload.", error);
  }

  const { signature, ...unsignedPayload } = parsed;
  const expectedSignature = samplePreviewSignature(unsignedPayload);
  const signatureBuffer = Buffer.from(signature ?? "");
  const expectedSignatureBuffer = Buffer.from(expectedSignature);
  if (
    parsed.version !== SAMPLE_PREVIEW_VERSION ||
    !signature ||
    signatureBuffer.length !== expectedSignatureBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
  ) {
    throw new SampleBatchConfirmationError("INVALID_PREVIEW", "Invalid sample preview signature.");
  }

  if (new Date(parsed.expiresAt).getTime() <= (options.now ?? new Date()).getTime()) {
    throw new SampleBatchConfirmationError("PREVIEW_EXPIRED", "Sample preview expired.");
  }

  if (!Array.isArray(parsed.units) || parsed.units.length !== SAMPLE_BATCH_QUANTITY) {
    throw new SampleBatchConfirmationError("INVALID_PREVIEW", "Invalid sample preview quantity.");
  }

  const seen = new Set<string>();
  return parsed.units.map((unit, index) => {
    const validated = validateSamplePreviewUnit(unit, index, options.batchReference ?? SAMPLE_BATCH_REFERENCE);
    if (seen.has(validated.publicCode)) {
      throw new SampleBatchConfirmationError("INVALID_PREVIEW", "Duplicate public code in sample preview.");
    }
    seen.add(validated.publicCode);
    return validated;
  });
}

export async function buildSampleManufacturerWorkbook(units: SampleBatchPreviewUnit[]) {
  return rowsToWorkbookBuffer(sampleUnitsToProductionRows(units));
}

export function buildSampleProductionDataCsv(units: SampleBatchPreviewUnit[]) {
  return rowsToCsv(sampleUnitsToProductionRows(units));
}

export function buildSampleInstructionsEnglish() {
  return manufacturerInstructionsEn();
}

export async function buildSampleQrZip(units: SampleBatchPreviewUnit[], format: "png" | "svg") {
  const zip = new JSZip();
  for (const unit of units) {
    if (format === "png") {
      const png = await QRCode.toBuffer(unit.qrContent, {
        type: "png",
        margin: 4,
        width: 1024,
        errorCorrectionLevel: "M",
      });
      zip.file(`${unit.publicCode}.png`, png);
    } else {
      const svg = await QRCode.toString(unit.qrContent, {
        type: "svg",
        margin: 4,
        width: 1024,
        errorCorrectionLevel: "M",
      });
      zip.file(`${unit.publicCode}.svg`, svg);
    }
  }
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

export function buildSupplierReturnTemplateCsv(units: SampleBatchPreviewUnit[]) {
  const header = [
    "Wristband Reference",
    "Public Code",
    "Public URL",
    "NFC UID",
    "QR Test Result",
    "NFC Test Result",
    "Notes",
  ];
  const rows = units.map((unit) => [
    unit.wristbandReference,
    unit.publicCode,
    unit.publicUrl,
    "",
    "",
    "",
    "",
  ]);
  return [header, ...rows].map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
}

async function buildSampleQrPackageFiles(units: SampleBatchPreviewUnit[], format: "png" | "svg") {
  const files: SamplePackageFile[] = [];
  for (const unit of units) {
    if (format === "png") {
      const png = await QRCode.toBuffer(unit.qrContent, {
        type: "png",
        margin: 4,
        width: 1024,
        errorCorrectionLevel: "M",
      });
      files.push({ path: `qr-png/${unit.publicCode}.png`, data: png });
    } else {
      const svg = await QRCode.toString(unit.qrContent, {
        type: "svg",
        margin: 4,
        width: 1024,
        errorCorrectionLevel: "M",
      });
      files.push({ path: `qr-svg/${unit.publicCode}.svg`, data: svg });
    }
  }
  return files;
}

export async function buildSampleSupplierPackageFiles(units: SampleBatchPreviewUnit[]) {
  const csv = buildSampleProductionDataCsv(units);
  const workbook = await buildSampleManufacturerWorkbook(units);
  const supplierReturn = buildSupplierReturnTemplateCsv(units);
  const instructions = buildSampleInstructionsEnglish();
  const manifest = JSON.stringify(
    {
      packageReference: SAMPLE_BATCH_REFERENCE,
      supplierName: "Emilia",
      quantity: SAMPLE_BATCH_QUANTITY,
      domain: SAMPLE_BATCH_DOMAIN,
      productionMode: "SAMPLE",
      generatedAt: new Date().toISOString(),
      secretCredentialsIncluded: false,
      files: [
        "production-data.csv",
        "production-data.xlsx",
        "instructions-en.txt",
        "supplier-return-template.csv",
        "qr-png/[publicCode].png",
        "qr-svg/[publicCode].svg",
      ],
    },
    null,
    2,
  );

  const files: SamplePackageFile[] = [
    { path: "production-data.csv", data: csv },
    { path: "production-data.xlsx", data: workbook },
    { path: "instructions-en.txt", data: instructions },
    { path: "supplier-return-template.csv", data: supplierReturn },
    { path: "manifest.json", data: manifest },
    ...(await buildSampleQrPackageFiles(units, "png")),
    ...(await buildSampleQrPackageFiles(units, "svg")),
  ];

  return files;
}

export async function getConfirmedSampleBatch() {
  const batch = await prisma.batch.findUnique({
    where: { internalReference: SAMPLE_BATCH_REFERENCE },
    include: {
      devices: {
        orderBy: { internalSequence: "asc" },
        select: {
          internalSequence: true,
          publicCode: true,
          publicUrl: true,
          qrContent: true,
          nfcContent: true,
          productionStatus: true,
          status: true,
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
    createdAt: batch.createdAt,
    units: batch.devices.map((device, index) => ({
      wristbandReference: `W-${String(device.internalSequence ?? index + 1).padStart(3, "0")}`,
      publicCode: device.publicCode,
      publicUrl: device.publicUrl,
      qrContent: device.qrContent ?? device.publicUrl,
      nfcContent: device.nfcContent ?? device.publicUrl,
      qrFilename: `${device.publicCode}.svg`,
      batchReference: SAMPLE_BATCH_REFERENCE,
      initialState: "UNACTIVATED" as const,
      persistedStatus: device.status,
      productionStatus: device.productionStatus,
    })),
  };
}

export async function buildSampleChecksumsText(units: SampleBatchPreviewUnit[]) {
  const files = await buildSampleSupplierPackageFiles(units);
  return files.map((file) => `${sha256(file.data)}  ${file.path}`).join("\n");
}

export async function buildSampleSupplierPackageZip(units: SampleBatchPreviewUnit[]) {
  const zip = new JSZip();
  const files = await buildSampleSupplierPackageFiles(units);
  for (const file of files) {
    zip.file(file.path, file.data);
  }
  zip.file("checksums-sha256.txt", files.map((file) => `${sha256(file.data)}  ${file.path}`).join("\n"));
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

export async function confirmSamplePreviewBatch(input: {
  encodedUnits: string;
  actorUserId?: string;
  confirmedIrreversible?: boolean;
  batchReference?: string;
}) {
  const batchReference = input.batchReference ?? SAMPLE_BATCH_REFERENCE;
  const units = decodeSampleUnits(input.encodedUnits, { batchReference });
  assertSampleConfirmationNeverExposeActivation(input.encodedUnits);
  if (!input.confirmedIrreversible) {
    throw new SampleBatchConfirmationError("INVALID_PREVIEW", "Irreversible confirmation is required.");
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const existingBatch = await tx.batch.findUnique({ where: { internalReference: batchReference } });
      if (existingBatch) {
        throw new SampleBatchConfirmationError("BATCH_REFERENCE_ALREADY_EXISTS", "Sample batch already exists.");
      }

      const existingDevices = await tx.device.findMany({
        where: { publicCode: { in: units.map((unit) => unit.publicCode) } },
        select: { publicCode: true },
      });
      if (existingDevices.length) {
        throw new SampleBatchConfirmationError("PUBLIC_CODE_COLLISION", "Sample public code already exists.");
      }

      const batch = await tx.batch.create({
        data: {
          internalReference: batchReference,
          supplierName: "Emilia",
          productType: ProductType.WRISTBAND,
          productModel: "Sample wristband",
          chipType: "NTAG213",
          domain: SAMPLE_BATCH_DOMAIN,
          productionMode: "SAMPLE",
          quantity: SAMPLE_BATCH_QUANTITY,
          status: "AWAITING_QUOTE",
          notes:
            "Sample real de 5 unidades. No enviar al proveedor hasta aprobacion manual y revision de archivos.",
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
            productType: ProductType.WRISTBAND,
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
          action: "SAMPLE_BATCH_CONFIRMED",
          entityType: "Batch",
          entityId: batch.id,
          newData: JSON.stringify({
            internalReference: batch.internalReference,
            quantity: batch.quantity,
            productionMode: batch.productionMode,
            publicCodes: units.map((unit) => unit.publicCode),
            secretCredentialsIncluded: false,
          }),
        },
      });

      return batch;
    });
  } catch (error) {
    if (isSampleBatchConfirmationError(error)) throw error;
    throw new SampleBatchConfirmationError(sampleConfirmationCodeForError(error), "Sample confirmation failed.", error);
  }
}

function validateSamplePreviewUnit(
  unit: SampleBatchPreviewUnit,
  index: number,
  batchReference: string,
): SampleBatchPreviewUnit {
  const publicCode = String(unit.publicCode ?? "").trim().toUpperCase();
  const publicUrl = buildPublicUrl(publicCode, SAMPLE_BATCH_DOMAIN);
  if (!/^[A-Z2-9]{8}$/.test(publicCode)) {
    throw new SampleBatchConfirmationError("INVALID_PREVIEW", "Invalid public code.");
  }
  if (unit.publicUrl !== publicUrl || unit.qrContent !== publicUrl || unit.nfcContent !== publicUrl) {
    throw new SampleBatchConfirmationError("INVALID_PREVIEW", "Invalid permanent URL mapping.");
  }
  if (unit.batchReference !== batchReference || unit.initialState !== "UNACTIVATED") {
    throw new SampleBatchConfirmationError("INVALID_PREVIEW", "Invalid sample preview metadata.");
  }

  return {
    wristbandReference: `W-${String(index + 1).padStart(3, "0")}`,
    publicCode,
    publicUrl,
    qrContent: publicUrl,
    nfcContent: publicUrl,
    qrFilename: `${publicCode}.svg`,
    batchReference,
    initialState: "UNACTIVATED",
  };
}
