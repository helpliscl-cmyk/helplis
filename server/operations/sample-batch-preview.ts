import { DeviceStatus, ProductType } from "@prisma/client";
import JSZip from "jszip";
import QRCode from "qrcode";
import { hashActivationCode } from "@/lib/security/hashing";
import { prisma } from "@/server/db/client";
import { buildPublicUrl, generateActivationCode, generatePublicCode } from "@/server/services/codes";
import { encryptActivationCode } from "./activation-code-vault";
import { rowsToWorkbookBuffer, type ProductionExportRow } from "./manufacturer-export";

export const SAMPLE_BATCH_REFERENCE = "SAMPLE-HELPLIS-001";
export const SAMPLE_BATCH_QUANTITY = 5;
export const SAMPLE_BATCH_DOMAIN = "https://helplis.cl";

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

export type SampleBatchPreview = {
  internalReference: typeof SAMPLE_BATCH_REFERENCE;
  quantity: typeof SAMPLE_BATCH_QUANTITY;
  domain: typeof SAMPLE_BATCH_DOMAIN;
  productionMode: "SAMPLE";
  exportFormat: "XLSX + QR SVG + QR PNG + supplier return template";
  units: SampleBatchPreviewUnit[];
};

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

export function encodeSampleUnits(units: SampleBatchPreviewUnit[]) {
  return Buffer.from(JSON.stringify(units), "utf8").toString("base64url");
}

export function decodeSampleUnits(value: string): SampleBatchPreviewUnit[] {
  const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as SampleBatchPreviewUnit[];
  if (!Array.isArray(parsed) || parsed.length !== SAMPLE_BATCH_QUANTITY) throw new Error("Invalid sample preview.");
  return parsed.map((unit, index) => validateSamplePreviewUnit(unit, index));
}

export async function buildSampleManufacturerWorkbook(units: SampleBatchPreviewUnit[]) {
  return rowsToWorkbookBuffer(sampleUnitsToProductionRows(units));
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

export async function confirmSamplePreviewBatch(input: {
  encodedUnits: string;
  actorUserId?: string;
}) {
  const units = decodeSampleUnits(input.encodedUnits);
  const existingBatch = await prisma.batch.findUnique({ where: { internalReference: SAMPLE_BATCH_REFERENCE } });
  if (existingBatch) throw new Error("Sample batch already exists.");

  const existingDevices = await prisma.device.findMany({
    where: { publicCode: { in: units.map((unit) => unit.publicCode) } },
    select: { publicCode: true },
  });
  if (existingDevices.length) throw new Error("Sample public code already exists.");

  return prisma.$transaction(async (tx) => {
    const batch = await tx.batch.create({
      data: {
        internalReference: SAMPLE_BATCH_REFERENCE,
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
          activationCodeIncluded: false,
        }),
      },
    });

    return batch;
  });
}

function validateSamplePreviewUnit(unit: SampleBatchPreviewUnit, index: number): SampleBatchPreviewUnit {
  const publicCode = String(unit.publicCode ?? "").trim().toUpperCase();
  const publicUrl = buildPublicUrl(publicCode, SAMPLE_BATCH_DOMAIN);
  if (!/^[A-Z2-9]{8}$/.test(publicCode)) throw new Error("Invalid public code.");
  if (unit.publicUrl !== publicUrl || unit.qrContent !== publicUrl || unit.nfcContent !== publicUrl) {
    throw new Error("Invalid permanent URL mapping.");
  }

  return {
    wristbandReference: `W-${String(index + 1).padStart(3, "0")}`,
    publicCode,
    publicUrl,
    qrContent: publicUrl,
    nfcContent: publicUrl,
    qrFilename: `${publicCode}.svg`,
    batchReference: SAMPLE_BATCH_REFERENCE,
    initialState: "UNACTIVATED",
  };
}
