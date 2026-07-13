"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { BatchStatus, ProductType, ProductionFileType, ProductionMode } from "@prisma/client";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/server/db/client";
import {
  generateManufacturerExportPackage,
  sha256,
  type ManufacturerExportFormat,
} from "@/server/operations/manufacturer-export";
import { generateProductionCodesForBatch } from "@/server/operations/production-codes";
import { recordPhysicalVerification } from "@/server/operations/physical-verification";
import { confirmSamplePreviewBatch } from "@/server/operations/sample-batch-preview";
import { importSupplierUidReturn } from "@/server/operations/supplier-uid-import";

const adminRoles = ["ADMIN", "SUPER_ADMIN", "SUPPORT"] as const;
const manufacturerExportFormats: ManufacturerExportFormat[] = [
  "URLS_ONLY",
  "CSV",
  "XLSX",
  "QR_PNG_ZIP",
  "QR_SVG_ZIP",
  "FULL_PACKAGE",
];
const supplierEvidenceTypes = [
  ProductionFileType.SUPPLIER_QUOTE,
  ProductionFileType.SUPPLIER_MOCKUP,
  ProductionFileType.SUPPLIER_PHOTO,
  ProductionFileType.SUPPLIER_VIDEO,
  ProductionFileType.SUPPLIER_EXCEL,
] as const;
const productionRoot = path.join(process.cwd(), "data", "production");

function text(formData: FormData, key: string, fallback = "") {
  return String(formData.get(key) ?? fallback).trim();
}

function nullableText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value || null;
}

function parseEnum<T extends Record<string, string>>(values: T, raw: FormDataEntryValue | null, fallback: T[keyof T]) {
  const value = String(raw ?? fallback);
  return Object.values(values).includes(value) ? (value as T[keyof T]) : fallback;
}

function buildReference(mode: ProductionMode) {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `${mode === "DEMO" ? "SAMPLE-DEMO" : "HLP-PROD"}-${stamp}-${Math.floor(Math.random() * 900 + 100)}`;
}

function safeReference(value: string) {
  return value.replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "batch";
}

function safeFilename(value: string) {
  const parsed = path.parse(value || "supplier-evidence.bin");
  const name = safeReference(parsed.name);
  const ext = parsed.ext.replace(/[^A-Za-z0-9.]/g, "").slice(0, 12);
  return `${name}${ext || ".bin"}`;
}

export async function createProductionBatchAction(formData: FormData) {
  const user = await requireRole([...adminRoles]);
  const quantity = Number(formData.get("quantity") ?? 0);
  const productionMode = parseEnum(ProductionMode, formData.get("productionMode"), ProductionMode.DEMO);
  const productType = parseEnum(ProductType, formData.get("productType"), ProductType.WRISTBAND);
  const internalReference = text(formData, "internalReference") || buildReference(productionMode);

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 500) {
    redirect("/admin/production/new?error=quantity");
  }

  const batch = await prisma.batch.create({
    data: {
      internalReference,
      supplierName: text(formData, "supplierName", "Proveedor por definir"),
      supplierContact: nullableText(formData, "supplierContact"),
      supplierQuoteReference: nullableText(formData, "supplierQuoteReference"),
      productModel: nullableText(formData, "productModel"),
      productType,
      color: nullableText(formData, "color"),
      chipType: nullableText(formData, "chipType"),
      domain: text(formData, "domain", "https://helplis.cl").replace(/\/+$/, ""),
      productionMode,
      quantity,
      status: BatchStatus.DRAFT,
      notes: text(formData, "notes"),
      createdBy: user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "PRODUCTION_BATCH_CREATED",
      entityType: "Batch",
      entityId: batch.id,
      newData: JSON.stringify({
        internalReference,
        quantity,
        productionMode,
        productType,
      }),
    },
  });

  redirect(`/admin/production/${batch.id}`);
}

export async function generateProductionCodesAction(formData: FormData) {
  const user = await requireRole([...adminRoles]);
  const batchId = text(formData, "batchId");
  if (!batchId) redirect("/admin/production?error=batch");

  await generateProductionCodesForBatch(batchId, user.id);
  revalidatePath("/admin/production");
  redirect(`/admin/production/${batchId}?generated=1`);
}

export async function updateProductionBatchAction(formData: FormData) {
  const user = await requireRole([...adminRoles]);
  const batchId = text(formData, "batchId");
  if (!batchId) redirect("/admin/production?error=batch");

  const status = parseEnum(BatchStatus, formData.get("status"), BatchStatus.DRAFT);
  const date = new Date();
  const data: Record<string, unknown> = {
    supplierName: text(formData, "supplierName", "Proveedor por definir"),
    supplierContact: nullableText(formData, "supplierContact"),
    supplierQuoteReference: nullableText(formData, "supplierQuoteReference"),
    productModel: nullableText(formData, "productModel"),
    color: nullableText(formData, "color"),
    chipType: nullableText(formData, "chipType"),
    notes: text(formData, "notes"),
    status,
  };

  if (status === "SENT_TO_SUPPLIER") data.sentToSupplierAt = date;
  if (status === "MASS_PRODUCTION" || status === "SAMPLE_PRODUCTION") data.productionStartedAt = date;
  if (status === "MASS_PRODUCTION_COMPLETE") data.productionCompletedAt = date;
  if (status === "SHIPPED" || status === "SAMPLE_SHIPPED") data.shippedAt = date;
  if (status === "RECEIVED" || status === "SAMPLE_RECEIVED") data.receivedAt = date;
  if (status === "VERIFIED" || status === "SAMPLE_APPROVED") data.verifiedAt = date;

  await prisma.batch.update({ where: { id: batchId }, data });
  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "PRODUCTION_BATCH_UPDATED",
      entityType: "Batch",
      entityId: batchId,
      newData: JSON.stringify({ status, notes: data.notes }),
    },
  });

  revalidatePath(`/admin/production/${batchId}`);
  redirect(`/admin/production/${batchId}?updated=1`);
}

export async function createSampleProductionBatchAction(formData: FormData) {
  formData.set("productionMode", "DEMO");
  formData.set("internalReference", text(formData, "internalReference") || "SAMPLE-DEMO-001");
  formData.set("supplierName", text(formData, "supplierName", "Proveedor demo"));
  formData.set("productType", text(formData, "productType", "WRISTBAND"));
  formData.set("domain", text(formData, "domain", "https://helplis.cl"));
  return createProductionBatchAction(formData);
}

export async function confirmSamplePreviewBatchAction(formData: FormData) {
  const user = await requireRole([...adminRoles]);
  const encodedUnits = text(formData, "encodedUnits");
  const confirmedIrreversible = ["yes", "on", "true"].includes(String(formData.get("confirmIrreversible") ?? ""));
  if (!encodedUnits) redirect("/admin/production/sample-preview?error=preview");
  if (!confirmedIrreversible) redirect("/admin/production/sample-preview?error=confirm-required");

  try {
    const batch = await confirmSamplePreviewBatch({ encodedUnits, actorUserId: user.id, confirmedIrreversible });
    revalidatePath("/admin/production");
    redirect(`/admin/production/${batch.id}?sample=confirmed`);
  } catch {
    redirect("/admin/production/sample-preview?error=confirm");
  }
}

export async function generateManufacturerExportAction(formData: FormData) {
  const user = await requireRole([...adminRoles]);
  const batchId = text(formData, "batchId");
  const requestedFormat = text(formData, "format", "FULL_PACKAGE") as ManufacturerExportFormat;
  const format = manufacturerExportFormats.includes(requestedFormat) ? requestedFormat : "FULL_PACKAGE";
  if (!batchId) redirect("/admin/production?error=batch");

  await generateManufacturerExportPackage({ batchId, format, generatedBy: user.id });
  revalidatePath(`/admin/production/${batchId}`);
  redirect(`/admin/production/${batchId}/export?generated=1`);
}

export async function importSupplierUidReturnAction(formData: FormData) {
  const user = await requireRole([...adminRoles]);
  const batchId = text(formData, "batchId");
  const dryRun = formData.get("dryRun") === "on";
  const pasted = text(formData, "csv");
  const uploaded = formData.get("file");
  let filename = text(formData, "filename", "supplier-return.csv");
  let buffer: Buffer | null = pasted ? Buffer.from(pasted, "utf8") : null;

  if (!buffer && uploaded instanceof File && uploaded.size > 0) {
    filename = uploaded.name;
    buffer = Buffer.from(await uploaded.arrayBuffer());
  }
  if (!batchId || !buffer) redirect(`/admin/production/${batchId || ""}/supplier-return?error=file`);

  const importJob = await importSupplierUidReturn({
    batchId,
    filename,
    buffer,
    dryRun,
    createdBy: user.id,
  });

  revalidatePath(`/admin/production/${batchId}`);
  redirect(`/admin/production/${batchId}/supplier-return?import=${importJob.id}`);
}

export async function recordPhysicalVerificationAction(formData: FormData) {
  const user = await requireRole([...adminRoles]);
  const batchId = text(formData, "batchId");
  const publicCode = text(formData, "publicCode");
  if (!batchId || !publicCode) redirect(`/admin/production/${batchId || ""}/verification?error=device`);

  await recordPhysicalVerification({
    batchId,
    publicCode,
    qrObserved: text(formData, "qrObserved"),
    nfcObserved: text(formData, "nfcObserved"),
    nfcUidObserved: text(formData, "nfcUidObserved"),
    damaged: formData.get("damaged") === "on",
    missing: formData.get("missing") === "on",
    notes: text(formData, "notes"),
    photoUrl: text(formData, "photoUrl"),
    verifiedBy: user.id,
  });

  revalidatePath(`/admin/production/${batchId}`);
  redirect(`/admin/production/${batchId}/verification?verified=${encodeURIComponent(publicCode)}`);
}

export async function recordSupplierEvidenceAction(formData: FormData) {
  const user = await requireRole([...adminRoles]);
  const batchId = text(formData, "batchId");
  const requestedType = text(formData, "type") as ProductionFileType;
  const notes = text(formData, "notes");
  const uploaded = formData.get("file");

  if (!batchId) redirect("/admin/production?error=batch");
  if (!supplierEvidenceTypes.includes(requestedType as (typeof supplierEvidenceTypes)[number])) {
    redirect(`/admin/production/${batchId}?evidence=type`);
  }
  if (!(uploaded instanceof File) || uploaded.size <= 0) {
    redirect(`/admin/production/${batchId}?evidence=file`);
  }

  const batch = await prisma.batch.findUnique({ where: { id: batchId } });
  if (!batch) redirect("/admin/production?error=batch");

  const buffer = Buffer.from(await uploaded.arrayBuffer());
  const filename = `${Date.now()}-${safeFilename(uploaded.name)}`;
  const directory = path.join(productionRoot, safeReference(batch.internalReference), "supplier-evidence");
  await mkdir(directory, { recursive: true });
  const storagePath = path.join(directory, filename);
  await writeFile(storagePath, buffer);

  const productionFile = await prisma.productionFile.create({
    data: {
      batchId,
      type: requestedType,
      filename,
      storagePath,
      checksum: sha256(buffer),
      generatedBy: user.id,
      status: "READY",
      metadata: JSON.stringify({
        originalName: uploaded.name,
        contentType: uploaded.type || "application/octet-stream",
        sizeBytes: uploaded.size,
        notes,
        source: "supplier",
      }),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "SUPPLIER_EVIDENCE_RECORDED",
      entityType: "ProductionFile",
      entityId: productionFile.id,
      newData: JSON.stringify({
        batchId,
        type: requestedType,
        filename,
        checksum: productionFile.checksum,
        notes,
      }),
    },
  });

  revalidatePath(`/admin/production/${batchId}`);
  redirect(`/admin/production/${batchId}?evidence=recorded`);
}
