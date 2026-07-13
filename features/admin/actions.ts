"use server";

import { redirect } from "next/navigation";
import { DeviceStatus, ProductType } from "@prisma/client";
import { requireRole } from "@/lib/auth/session";
import { hashActivationCode } from "@/lib/security/hashing";
import { prisma } from "@/server/db/client";
import { buildPublicUrl, generateActivationCode, generateUniquePublicCode } from "@/server/services/codes";

export async function createBatchAction(formData: FormData) {
  await requireRole(["ADMIN", "SUPER_ADMIN", "SUPPORT"]);
  const quantity = Number(formData.get("quantity") ?? 0);
  const productType = String(formData.get("productType") ?? "WRISTBAND") as ProductType;
  const internalReference =
    String(formData.get("internalReference") ?? "").trim() || `HLP-BATCH-${Date.now()}`;
  if (!quantity || quantity < 1 || quantity > 200) redirect("/admin/batches?error=quantity");

  const batch = await prisma.batch.create({
    data: {
      supplierName: String(formData.get("supplierName") ?? "Proveedor demo"),
      supplierReference: String(formData.get("supplierReference") ?? ""),
      internalReference,
      quantity,
      receivedQuantity: quantity,
      status: "GENERATED",
      notes: String(formData.get("notes") ?? ""),
    },
  });

  for (let index = 0; index < quantity; index += 1) {
    const publicCode = await generateUniquePublicCode(async (code) => {
      const existing = await prisma.device.findUnique({ where: { publicCode: code } });
      return Boolean(existing);
    });
    const activationCode = generateActivationCode();
    const publicUrl = buildPublicUrl(publicCode);
    await prisma.device.create({
      data: {
        publicCode,
        publicUrl,
        qrContent: publicUrl,
        nfcContent: publicUrl,
        activationCodeHash: await hashActivationCode(activationCode),
        batchId: batch.id,
        productType,
        status: "AVAILABLE",
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      action: "BATCH_GENERATED",
      entityType: "Batch",
      entityId: batch.id,
      newData: JSON.stringify({ quantity, productType }),
    },
  });

  redirect(`/admin/batches?created=${batch.id}`);
}

export async function updateAdminDeviceStatusAction(formData: FormData) {
  const user = await requireRole(["ADMIN", "SUPER_ADMIN", "SUPPORT"]);
  const deviceId = String(formData.get("deviceId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["ACTIVATED", "SUSPENDED", "DEACTIVATED"].includes(status)) redirect("/admin/devices?error=invalid");

  const device = await prisma.device.findUnique({
    where: { id: deviceId },
    select: {
      id: true,
      publicCode: true,
      status: true,
      ownerId: true,
      profileId: true,
      nfcUid: true,
      qrContent: true,
      nfcContent: true,
    },
  });
  if (!device) redirect("/admin/devices?error=not_found");

  const nextStatus = status as DeviceStatus;
  const changedAt = new Date();
  await prisma.device.update({
    where: { id: device.id },
    data: {
      status: nextStatus,
      suspendedAt: nextStatus === "SUSPENDED" ? changedAt : null,
      deactivatedAt: nextStatus === "DEACTIVATED" ? changedAt : null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "ADMIN_DEVICE_STATUS_UPDATED",
      entityType: "Device",
      entityId: device.id,
      previousData: JSON.stringify({
        publicCode: device.publicCode,
        status: device.status,
        ownerId: device.ownerId,
        profileId: device.profileId,
        nfcUid: device.nfcUid,
        qrContent: device.qrContent,
        nfcContent: device.nfcContent,
      }),
      newData: JSON.stringify({
        publicCode: device.publicCode,
        status: nextStatus,
        changedAt: changedAt.toISOString(),
      }),
    },
  });

  redirect("/admin/devices?status=updated");
}

export async function importCsvAction(formData: FormData) {
  await requireRole(["ADMIN", "SUPER_ADMIN", "SUPPORT"]);
  const csv = String(formData.get("csv") ?? "");
  const filename = String(formData.get("filename") ?? "manual-import.csv");
  const batchId = String(formData.get("batchId") ?? "") || null;
  const rows = csv
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean);

  const seenCodes = new Set<string>();
  const seenUids = new Set<string>();
  let validRows = 0;
  let invalidRows = 0;

  const job = await prisma.importJob.create({
    data: {
      batchId,
      filename,
      totalRows: rows.length,
      status: "VALIDATED",
    },
  });

  for (const [index, row] of rows.entries()) {
    const [publicCodeRaw, publicUrlRaw, nfcUidRaw, productTypeRaw] = row.split(",").map((part) => part?.trim());
    const publicCode = publicCodeRaw?.toUpperCase();
    const nfcUid = nfcUidRaw?.toUpperCase();
    const errors: string[] = [];

    if (!publicCode || !/^[A-Z0-9]{4,12}$/.test(publicCode)) errors.push("publicCode inválido");
    if (!publicUrlRaw || publicUrlRaw !== buildPublicUrl(publicCode ?? "")) errors.push("URL no coincide con dominio base");
    if (publicCode && seenCodes.has(publicCode)) errors.push("publicCode duplicado en archivo");
    if (nfcUid && seenUids.has(nfcUid)) errors.push("UID NFC duplicado en archivo");

    const existingCode = publicCode
      ? await prisma.device.findUnique({ where: { publicCode } })
      : null;
    const existingUid = nfcUid ? await prisma.device.findUnique({ where: { nfcUid } }) : null;
    if (existingCode) errors.push("publicCode ya existe");
    if (existingUid) errors.push("UID NFC ya existe");

    const productType = Object.values(ProductType).includes(productTypeRaw as ProductType)
      ? (productTypeRaw as ProductType)
      : ProductType.WRISTBAND;

    if (publicCode) seenCodes.add(publicCode);
    if (nfcUid) seenUids.add(nfcUid);

    const isValid = errors.length === 0;
    if (isValid) validRows += 1;
    else invalidRows += 1;

    await prisma.importRow.create({
      data: {
        importJobId: job.id,
        rowNumber: index + 1,
        publicCode,
        publicUrl: publicUrlRaw,
        nfcUid,
        productType,
        isValid,
        errors: errors.length ? JSON.stringify(errors) : null,
        rawData: row,
      },
    });

    if (isValid && publicCode) {
      await prisma.device.create({
        data: {
          publicCode,
          publicUrl: publicUrlRaw,
          qrContent: publicUrlRaw,
          nfcContent: publicUrlRaw,
          nfcUid,
          productType,
          batchId,
          status: "AVAILABLE",
          activationCodeHash: await hashActivationCode(generateActivationCode()),
        },
      });
    }
  }

  await prisma.importJob.update({
    where: { id: job.id },
    data: {
      validRows,
      invalidRows,
      errors: invalidRows ? JSON.stringify({ invalidRows }) : null,
      status: invalidRows ? "VALIDATED" : "IMPORTED",
    },
  });

  redirect(`/admin/imports?job=${job.id}`);
}

export async function createOrganizationAction(formData: FormData) {
  await requireRole(["ADMIN", "SUPER_ADMIN", "SUPPORT"]);
  const organization = await prisma.organization.create({
    data: {
      name: String(formData.get("name") ?? ""),
      type: String(formData.get("type") ?? "OTHER") as "SCHOOL",
      slug: String(formData.get("slug") ?? "").toLowerCase(),
      contactName: String(formData.get("contactName") ?? ""),
      contactEmail: String(formData.get("contactEmail") ?? ""),
      contactPhone: String(formData.get("contactPhone") ?? ""),
      status: "ACTIVE",
      discountCode: String(formData.get("discountCode") ?? ""),
      discountPercentage: Number(formData.get("discountPercentage") ?? 0),
      commissionPercentage: Number(formData.get("commissionPercentage") ?? 0),
      landingTitle: String(formData.get("landingTitle") ?? ""),
      landingDescription: String(formData.get("landingDescription") ?? ""),
    },
  });
  redirect(`/admin/organizations?created=${organization.slug}`);
}

export async function createCampaignAction(formData: FormData) {
  await requireRole(["ADMIN", "SUPER_ADMIN", "SUPPORT"]);
  const campaign = await prisma.campaign.create({
    data: {
      organizationId: String(formData.get("organizationId") ?? ""),
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? "").toLowerCase(),
      description: String(formData.get("description") ?? ""),
      discountCode: String(formData.get("discountCode") ?? ""),
      discountPercentage: Number(formData.get("discountPercentage") ?? 0),
      commissionPercentage: Number(formData.get("commissionPercentage") ?? 0),
      status: "ACTIVE",
    },
  });
  redirect(`/admin/campaigns?created=${campaign.id}`);
}
