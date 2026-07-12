import { ProductType } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { getHelplisPack, getPackUnitPrice, normalizePackId, type PackId } from "@/lib/marketing/pricing";

export type OrderInput = {
  customerName: string;
  phone: string;
  email?: string | null;
  region: string;
  comuna: string;
  address?: string | null;
  addressNotes?: string | null;
  packId: PackId;
  shippingCost?: number;
  source?: string | null;
  notes?: string | null;
  leadId?: string | null;
  userId?: string | null;
  actorUserId?: string;
};

async function nextOrderNumber() {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const count = await prisma.order.count({
    where: { orderNumber: { startsWith: `HLP-${today}` } },
  });
  return `HLP-${today}-${String(count + 1).padStart(4, "0")}`;
}

export function calculateOrderTotals(packId: PackId, shippingCost = 0) {
  const pack = getHelplisPack(packId);
  return {
    pack,
    quantity: pack.quantity,
    unitPrice: getPackUnitPrice(pack),
    subtotal: pack.totalPrice,
    shippingCost: Math.max(0, Math.round(shippingCost || 0)),
    total: pack.totalPrice + Math.max(0, Math.round(shippingCost || 0)),
  };
}

export async function createOrder(input: OrderInput) {
  if (input.leadId) {
    const existing = await prisma.order.findUnique({ where: { leadId: input.leadId } });
    if (existing) return existing;
  }

  const totals = calculateOrderTotals(input.packId, input.shippingCost);
  const order = await prisma.order.create({
    data: {
      orderNumber: await nextOrderNumber(),
      leadId: input.leadId,
      userId: input.userId,
      customerName: input.customerName.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim() || null,
      region: input.region.trim(),
      comuna: input.comuna.trim(),
      address: input.address?.trim() || null,
      addressNotes: input.addressNotes?.trim() || null,
      pack: totals.pack.id,
      quantity: totals.quantity,
      unitPrice: totals.unitPrice,
      subtotal: totals.subtotal,
      shippingCost: totals.shippingCost,
      total: totals.total,
      source: input.source,
      notes: input.notes,
      fulfillmentStatus: "NEW",
      paymentStatus: "PENDING",
      items: {
        create: Array.from({ length: totals.quantity }, () => ({
          productType: ProductType.WRISTBAND,
          unitPrice: totals.unitPrice,
          status: "PENDING",
        })),
      },
    },
  });

  if (input.leadId) {
    await prisma.purchaseIntent.update({ where: { id: input.leadId }, data: { status: "ORDER_CREATED" } });
  }

  await prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId,
      action: input.leadId ? "LEAD_CONVERTED_TO_ORDER" : "ORDER_CREATED",
      entityType: "Order",
      entityId: order.id,
      newData: JSON.stringify({
        orderNumber: order.orderNumber,
        leadId: input.leadId,
        pack: totals.pack.id,
        quantity: totals.quantity,
        total: totals.total,
      }),
    },
  });

  return order;
}

export async function createOrderFromLead(leadId: string, actorUserId?: string) {
  const lead = await prisma.purchaseIntent.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Lead not found.");
  return createOrder({
    customerName: lead.name,
    phone: lead.phone,
    email: lead.email,
    region: lead.region,
    comuna: lead.commune,
    packId: normalizePackId(lead.packId),
    shippingCost: 0,
    source: lead.origin ?? lead.source ?? "lead",
    notes: [lead.primaryUse, lead.message].filter(Boolean).join("\n"),
    leadId: lead.id,
    actorUserId,
  });
}
