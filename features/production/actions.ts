"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { BatchStatus, ProductType, ProductionMode } from "@prisma/client";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/server/db/client";
import {
  generateManufacturerExportPackage,
  type ManufacturerExportFormat,
} from "@/server/operations/manufacturer-export";
import { generateProductionCodesForBatch } from "@/server/operations/production-codes";
import { importSupplierUidReturn } from "@/server/operations/supplier-uid-import";

const adminRoles = ["ADMIN", "SUPER_ADMIN", "SUPPORT"] as const;

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

export async function generateManufacturerExportAction(formData: FormData) {
  const user = await requireRole([...adminRoles]);
  const batchId = text(formData, "batchId");
  const format = text(formData, "format", "FULL_PACKAGE") as ManufacturerExportFormat;
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
