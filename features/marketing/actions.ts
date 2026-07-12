"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { OFFICIAL_CONTACT } from "@/lib/constants";
import { getHelplisPack, getPackUnitPrice } from "@/lib/marketing/pricing";
import { prisma } from "@/server/db/client";
import { notificationProvider } from "@/server/notifications/provider";

const purchaseIntentSchema = z.object({
  name: z.string().trim().min(2),
  phone: z.string().trim().min(6),
  email: z.string().trim().email().optional().or(z.literal("")),
  commune: z.string().trim().min(2),
  region: z.string().trim().min(2),
  pack: z.string().trim().optional(),
  expectedTotalPrice: z.coerce.number().int().positive().optional(),
  primaryUse: z.string().trim().min(2),
  contactAccepted: z.literal("on"),
  source: z.string().trim().optional(),
  origin: z.string().trim().optional(),
  message: z.string().trim().max(500).optional(),
});

type PurchaseIntentInput = z.infer<typeof purchaseIntentSchema>;

export async function createPurchaseIntentAction(formData: FormData) {
  const fallbackPack = getHelplisPack(formData.get("pack"));
  const fallbackSource = String(formData.get("source") ?? "order_form");
  const redirectWithError = (error: string): never =>
    redirect(`/quiero-helplis?error=${error}&pack=${fallbackPack.id}&source=${encodeURIComponent(fallbackSource)}`);

  const parsed = purchaseIntentSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email") || undefined,
    commune: formData.get("commune"),
    region: formData.get("region"),
    pack: formData.get("pack") || undefined,
    expectedTotalPrice: formData.get("expectedTotalPrice") || undefined,
    primaryUse: formData.get("primaryUse"),
    contactAccepted: formData.get("contactAccepted"),
    source: formData.get("source") || undefined,
    origin: formData.get("origin") || undefined,
    message: formData.get("message") || undefined,
  });

  if (!parsed.success) redirectWithError("invalid");

  const data = parsed.data as PurchaseIntentInput;
  const pack = getHelplisPack(data.pack);
  const unitPrice = getPackUnitPrice(pack);
  if (data.expectedTotalPrice && data.expectedTotalPrice !== pack.totalPrice) {
    redirectWithError("price");
  }

  const intent = await prisma.purchaseIntent.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      commune: data.commune,
      region: data.region,
      packId: Number(pack.id),
      quantity: pack.quantity,
      unitPrice,
      totalPrice: pack.totalPrice,
      shippingPending: true,
      primaryUse: data.primaryUse,
      contactAccepted: true,
      source: data.source,
      origin: data.origin ?? data.source,
      message: data.message,
    },
  });

  await notificationProvider.sendLocal({
    eventType: "PURCHASE_INTENT_CREATED",
    recipient: OFFICIAL_CONTACT.email,
    payload: {
      purchaseIntentId: intent.id,
      name: intent.name,
      phone: intent.phone,
      email: intent.email,
      commune: intent.commune,
      region: intent.region,
      packId: intent.packId,
      packName: pack.name,
      quantity: intent.quantity,
      totalPrice: intent.totalPrice,
      shippingPending: intent.shippingPending,
      primaryUse: intent.primaryUse,
      source: intent.source,
    },
  });

  await prisma.analyticsEvent.create({
    data: {
      eventName: "ORDER_INTENT_COMPLETED",
      path: "/quiero-helplis",
      target: `pack-${pack.id}`,
      metadata: JSON.stringify({
        pack: pack.id,
        quantity: pack.quantity,
        price: pack.totalPrice,
        origin: intent.origin ?? intent.source ?? "order_form",
      }),
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "PURCHASE_INTENT_CREATED",
      entityType: "PurchaseIntent",
      entityId: intent.id,
      newData: JSON.stringify({
        packId: intent.packId,
        primaryUse: intent.primaryUse,
        quantity: intent.quantity,
        totalPrice: intent.totalPrice,
        commune: intent.commune,
        region: intent.region,
      }),
    },
  });

  redirect(`/quiero-helplis?sent=1&intent=${intent.id}&pack=${pack.id}&source=${encodeURIComponent(intent.source ?? "order_form")}`);
}
