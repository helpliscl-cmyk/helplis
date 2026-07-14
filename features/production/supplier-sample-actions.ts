"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { assertProductionWriteSafety } from "@/lib/runtime/production-safety";
import { prisma } from "@/server/db/client";
import { SAMPLE_BATCH_REFERENCE } from "@/server/operations/sample-batch-preview";

const adminRoles = ["ADMIN", "SUPER_ADMIN", "SUPPORT"] as const;

function text(formData: FormData, key: string, fallback = "") {
  return String(formData.get(key) ?? fallback).trim();
}

export async function prepareSupplierSamplePackageAction(formData: FormData) {
  const user = await requireRole([...adminRoles]);
  assertProductionWriteSafety(user);
  const batchId = text(formData, "batchId");
  if (!batchId) redirect("/admin/production?error=batch");
  const batch = await prisma.batch.findUnique({ where: { id: batchId }, select: { internalReference: true } });
  if (!batch || batch.internalReference !== SAMPLE_BATCH_REFERENCE) {
    redirect(`/admin/production/${batchId}?supplierPackage=unsupported`);
  }

  let productionFileId: string | undefined;
  try {
    const { prepareSupplierSamplePackageFromDatabase } = await import("@/server/operations/supplier-sample-package");
    const result = await prepareSupplierSamplePackageFromDatabase({
      actorUserId: user.id,
      recordProductionFile: true,
    });
    productionFileId = result.productionFileId;
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        operation: "supplier-sample-package",
        actorUserId: user.id,
        batchId,
        timestamp: new Date().toISOString(),
        errorName: error instanceof Error ? error.name : "Error",
        errorMessage: error instanceof Error ? error.message : "Unknown supplier sample package error.",
      }),
    );
    redirect(`/admin/production/${batchId}?supplierPackage=error`);
  }

  revalidatePath(`/admin/production/${batchId}`);
  redirect(`/admin/production/${batchId}?supplierPackage=${productionFileId ?? "ready"}`);
}
