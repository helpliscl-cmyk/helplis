"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PaymentMethod, PaymentStatus, ShipmentStatus } from "@prisma/client";
import { requireRole } from "@/lib/auth/session";
import { ManualPaymentProvider } from "@/server/payments/provider";
import { ManualShippingProvider } from "@/server/shipping/provider";

function text(formData: FormData, key: string, fallback = "") {
  return String(formData.get(key) ?? fallback).trim();
}

function enumValue<T extends Record<string, string>>(values: T, raw: FormDataEntryValue | null, fallback: T[keyof T]) {
  const value = String(raw ?? fallback);
  return Object.values(values).includes(value) ? (value as T[keyof T]) : fallback;
}

function dateValue(value: string) {
  return value ? new Date(value) : null;
}

export async function createManualPaymentAction(formData: FormData) {
  const user = await requireRole(["ADMIN", "SUPER_ADMIN", "SUPPORT"]);
  const orderId = text(formData, "orderId");
  const provider = new ManualPaymentProvider();
  await provider.createPayment({
    orderId,
    method: enumValue(PaymentMethod, formData.get("method"), PaymentMethod.TRANSFER),
    amount: Number(formData.get("amount") ?? 0),
    status: enumValue(PaymentStatus, formData.get("status"), PaymentStatus.REPORTED),
    externalReference: text(formData, "externalReference") || null,
    proofUrl: text(formData, "proofUrl") || null,
    reportedAt: dateValue(text(formData, "reportedAt")),
    notes: text(formData, "notes") || null,
    createdBy: user.id,
  });
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/admin/orders/${orderId}?payment=1`);
}

export async function createManualShipmentAction(formData: FormData) {
  const user = await requireRole(["ADMIN", "SUPER_ADMIN", "SUPPORT"]);
  const orderId = text(formData, "orderId");
  const provider = new ManualShippingProvider();
  await provider.createShipment({
    orderId,
    carrier: text(formData, "carrier") || null,
    service: text(formData, "service") || null,
    trackingNumber: text(formData, "trackingNumber") || null,
    cost: Number(formData.get("cost") ?? 0),
    status: enumValue(ShipmentStatus, formData.get("status"), ShipmentStatus.DRAFT),
    shippedAt: dateValue(text(formData, "shippedAt")),
    estimatedDeliveryAt: dateValue(text(formData, "estimatedDeliveryAt")),
    deliveredAt: dateValue(text(formData, "deliveredAt")),
    notes: text(formData, "notes") || null,
    actorUserId: user.id,
  });
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/admin/orders/${orderId}?shipment=1`);
}
