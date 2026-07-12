"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { OrderFulfillmentStatus, OrderPaymentStatus } from "@prisma/client";
import { requireRole } from "@/lib/auth/session";
import { normalizePackId } from "@/lib/marketing/pricing";
import { prisma } from "@/server/db/client";
import { calculateOrderTotals, createOrder, createOrderFromLead } from "@/server/operations/orders";

function text(formData: FormData, key: string, fallback = "") {
  return String(formData.get(key) ?? fallback).trim();
}

function parseStatus<T extends Record<string, string>>(values: T, value: FormDataEntryValue | null, fallback: T[keyof T]) {
  const raw = String(value ?? fallback);
  return Object.values(values).includes(raw) ? (raw as T[keyof T]) : fallback;
}

export async function convertLeadToOrderAction(formData: FormData) {
  const user = await requireRole(["ADMIN", "SUPER_ADMIN", "SUPPORT"]);
  const leadId = text(formData, "leadId");
  if (!leadId) redirect("/admin/leads?error=lead");
  const order = await createOrderFromLead(leadId, user.id);
  revalidatePath("/admin/leads");
  redirect(`/admin/orders/${order.id}`);
}

export async function createManualOrderAction(formData: FormData) {
  const user = await requireRole(["ADMIN", "SUPER_ADMIN", "SUPPORT"]);
  const packId = normalizePackId(formData.get("pack"));
  const order = await createOrder({
    customerName: text(formData, "customerName"),
    phone: text(formData, "phone"),
    email: text(formData, "email") || null,
    region: text(formData, "region"),
    comuna: text(formData, "comuna"),
    address: text(formData, "address") || null,
    addressNotes: text(formData, "addressNotes") || null,
    packId,
    shippingCost: Number(formData.get("shippingCost") ?? 0),
    source: text(formData, "source", "manual"),
    notes: text(formData, "notes") || null,
    actorUserId: user.id,
  });
  redirect(`/admin/orders/${order.id}`);
}

export async function updateOrderAction(formData: FormData) {
  const user = await requireRole(["ADMIN", "SUPER_ADMIN", "SUPPORT"]);
  const orderId = text(formData, "orderId");
  const packId = normalizePackId(formData.get("pack"));
  const totals = calculateOrderTotals(packId, Number(formData.get("shippingCost") ?? 0));
  if (!orderId) redirect("/admin/orders?error=order");

  const paymentStatus = parseStatus(OrderPaymentStatus, formData.get("paymentStatus"), OrderPaymentStatus.PENDING);
  const fulfillmentStatus = parseStatus(
    OrderFulfillmentStatus,
    formData.get("fulfillmentStatus"),
    OrderFulfillmentStatus.NEW,
  );

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      customerName: text(formData, "customerName"),
      phone: text(formData, "phone"),
      email: text(formData, "email") || null,
      region: text(formData, "region"),
      comuna: text(formData, "comuna"),
      address: text(formData, "address") || null,
      addressNotes: text(formData, "addressNotes") || null,
      pack: totals.pack.id,
      quantity: totals.quantity,
      unitPrice: totals.unitPrice,
      subtotal: totals.subtotal,
      shippingCost: totals.shippingCost,
      total: totals.total,
      paymentStatus,
      fulfillmentStatus,
      notes: text(formData, "notes") || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "ORDER_UPDATED",
      entityType: "Order",
      entityId: order.id,
      newData: JSON.stringify({ orderNumber: order.orderNumber, paymentStatus, fulfillmentStatus }),
    },
  });
  revalidatePath(`/admin/orders/${order.id}`);
  redirect(`/admin/orders/${order.id}?updated=1`);
}
