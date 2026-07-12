"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { SupportTicketCategory, SupportTicketPriority } from "@prisma/client";
import { OFFICIAL_CONTACT } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/server/db/client";
import { notificationProvider } from "@/server/notifications/provider";
import { checkRateLimit } from "@/server/security/rate-limit";

const supportSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
  publicCode: z.string().optional(),
  orderNumber: z.string().optional(),
  subject: z.string().min(3),
  message: z.string().min(10),
});

export async function createSupportMessageAction(formData: FormData) {
  const parsed = supportSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    category: formData.get("category") || undefined,
    priority: formData.get("priority") || undefined,
    publicCode: formData.get("publicCode") || undefined,
    orderNumber: formData.get("orderNumber") || undefined,
    subject: formData.get("subject"),
    message: formData.get("message"),
  });
  if (!parsed.success) redirect("/support?error=invalid");
  if (!checkRateLimit(`support:${parsed.data.email}:${parsed.data.phone ?? ""}`, 5, 15 * 60 * 1000)) {
    redirect("/support?error=rate-limit");
  }

  const user = await getCurrentUser();
  const category = Object.values(SupportTicketCategory).includes(parsed.data.category as SupportTicketCategory)
    ? (parsed.data.category as SupportTicketCategory)
    : SupportTicketCategory.OTHER;
  const priority = Object.values(SupportTicketPriority).includes(parsed.data.priority as SupportTicketPriority)
    ? (parsed.data.priority as SupportTicketPriority)
    : SupportTicketPriority.NORMAL;
  const device = parsed.data.publicCode
    ? await prisma.device.findUnique({ where: { publicCode: parsed.data.publicCode.trim().toUpperCase() } })
    : null;
  const order = parsed.data.orderNumber
    ? await prisma.order.findUnique({ where: { orderNumber: parsed.data.orderNumber.trim() } })
    : null;
  const message = await prisma.supportMessage.create({
    data: {
      userId: user?.id,
      ...parsed.data,
    },
  });

  await notificationProvider.sendLocal({
    userId: user?.id,
    eventType: "SUPPORT_MESSAGE_CREATED",
    recipient: OFFICIAL_CONTACT.email,
    payload: {
      supportMessageId: message.id,
      subject: message.subject,
      from: message.email,
    },
  });

  await prisma.supportTicket.create({
    data: {
      userId: user?.id,
      orderId: order?.id,
      deviceId: device?.id,
      category,
      priority,
      subject: parsed.data.subject,
      description: `${parsed.data.message}\n\nContacto: ${parsed.data.name} · ${parsed.data.email} · ${parsed.data.phone ?? "sin telefono"}`,
    },
  });

  redirect("/support?sent=1");
}
