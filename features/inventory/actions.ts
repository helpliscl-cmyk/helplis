"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { InventoryStatus } from "@prisma/client";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/server/db/client";

function text(formData: FormData, key: string, fallback = "") {
  return String(formData.get(key) ?? fallback).trim();
}

function parseInventoryStatus(value: FormDataEntryValue | null) {
  const raw = String(value ?? "AVAILABLE");
  return Object.values(InventoryStatus).includes(raw as InventoryStatus) ? (raw as InventoryStatus) : InventoryStatus.AVAILABLE;
}

async function locationIdFromForm(formData: FormData) {
  const name = text(formData, "locationName");
  if (!name) return null;
  const warehouse = text(formData, "warehouse");
  const shelf = text(formData, "shelf");
  const box = text(formData, "box");
  const position = text(formData, "position");
  const location = await prisma.inventoryLocation.findFirst({
    where: { name, warehouse, shelf, box, position },
  });
  if (location) return location.id;
  const created = await prisma.inventoryLocation.create({
    data: {
      name,
      warehouse,
      shelf,
      box,
      position,
      notes: text(formData, "locationNotes"),
    },
  });
  return created.id;
}

export async function updateInventoryDeviceAction(formData: FormData) {
  const user = await requireRole(["ADMIN", "SUPER_ADMIN", "SUPPORT"]);
  const deviceId = text(formData, "deviceId");
  if (!deviceId) redirect("/admin/inventory?error=device");

  const status = parseInventoryStatus(formData.get("inventoryStatus"));
  const locationId = await locationIdFromForm(formData);
  const device = await prisma.device.update({
    where: { id: deviceId },
    data: {
      inventoryStatus: status,
      inventoryLocationId: locationId,
      reservedAt: status === "RESERVED" ? new Date() : undefined,
      packedAt: status === "PACKING" ? new Date() : undefined,
      shippedAt: status === "SHIPPED" ? new Date() : undefined,
      deliveredAt: status === "DELIVERED" ? new Date() : undefined,
      status: status === "DAMAGED" ? "DAMAGED" : undefined,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "INVENTORY_DEVICE_UPDATED",
      entityType: "Device",
      entityId: device.id,
      newData: JSON.stringify({
        publicCode: device.publicCode,
        inventoryStatus: status,
        inventoryLocationId: locationId,
        notes: text(formData, "notes"),
      }),
    },
  });

  revalidatePath("/admin/inventory");
  redirect(`/admin/inventory/${device.id}?updated=1`);
}

export async function quickInventoryAction(formData: FormData) {
  const user = await requireRole(["ADMIN", "SUPER_ADMIN", "SUPPORT"]);
  const deviceId = text(formData, "deviceId");
  const action = text(formData, "action");
  const device = await prisma.device.findUnique({ where: { id: deviceId } });
  if (!device) redirect("/admin/inventory?error=device");

  const data =
    action === "reserve"
      ? { inventoryStatus: InventoryStatus.RESERVED, reservedAt: new Date() }
      : action === "release"
        ? { inventoryStatus: InventoryStatus.AVAILABLE, reservedAt: null }
        : action === "damage"
          ? { inventoryStatus: InventoryStatus.DAMAGED, status: "DAMAGED" as const }
          : { inventoryStatus: device.inventoryStatus };

  await prisma.device.update({ where: { id: device.id }, data });
  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: `INVENTORY_${action.toUpperCase()}`,
      entityType: "Device",
      entityId: device.id,
      newData: JSON.stringify({ publicCode: device.publicCode, action }),
    },
  });
  revalidatePath("/admin/inventory");
  redirect(`/admin/inventory/${device.id}?action=${encodeURIComponent(action)}`);
}
