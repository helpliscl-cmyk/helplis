"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { OFFICIAL_CONTACT } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/server/db/client";
import { notificationProvider } from "@/server/notifications/provider";

const supportSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().min(3),
  message: z.string().min(10),
});

export async function createSupportMessageAction(formData: FormData) {
  const parsed = supportSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    subject: formData.get("subject"),
    message: formData.get("message"),
  });
  if (!parsed.success) redirect("/support?error=invalid");

  const user = await getCurrentUser();
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

  redirect("/support?sent=1");
}
