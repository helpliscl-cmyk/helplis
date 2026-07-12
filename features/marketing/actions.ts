"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { OFFICIAL_CONTACT } from "@/lib/constants";
import { prisma } from "@/server/db/client";
import { notificationProvider } from "@/server/notifications/provider";

const purchaseIntentSchema = z.object({
  name: z.string().trim().min(2),
  phone: z.string().trim().min(6),
  email: z.string().trim().email().optional().or(z.literal("")),
  commune: z.string().trim().min(2),
  quantity: z.coerce.number().int().min(1).max(200),
  primaryUse: z.string().trim().min(2),
  contactAccepted: z.literal("on"),
  source: z.string().trim().optional(),
  message: z.string().trim().max(500).optional(),
});

export async function createPurchaseIntentAction(formData: FormData) {
  const parsed = purchaseIntentSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email") || undefined,
    commune: formData.get("commune"),
    quantity: formData.get("quantity"),
    primaryUse: formData.get("primaryUse"),
    contactAccepted: formData.get("contactAccepted"),
    source: formData.get("source") || undefined,
    message: formData.get("message") || undefined,
  });

  if (!parsed.success) redirect("/quiero-helplis?error=invalid");

  const intent = await prisma.purchaseIntent.create({
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      commune: parsed.data.commune,
      quantity: parsed.data.quantity,
      primaryUse: parsed.data.primaryUse,
      contactAccepted: true,
      source: parsed.data.source,
      message: parsed.data.message,
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
      quantity: intent.quantity,
      primaryUse: intent.primaryUse,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "PURCHASE_INTENT_CREATED",
      entityType: "PurchaseIntent",
      entityId: intent.id,
      newData: JSON.stringify({
        primaryUse: intent.primaryUse,
        quantity: intent.quantity,
        commune: intent.commune,
      }),
    },
  });

  redirect("/quiero-helplis?sent=1");
}
