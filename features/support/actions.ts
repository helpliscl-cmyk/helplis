"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SupportTicketPriority, SupportTicketStatus } from "@prisma/client";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/server/db/client";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function updateSupportTicketAction(formData: FormData) {
  const user = await requireRole(["ADMIN", "SUPER_ADMIN", "SUPPORT"]);
  const ticketId = text(formData, "ticketId");
  const rawStatus = text(formData, "status");
  const rawPriority = text(formData, "priority");
  const status = Object.values(SupportTicketStatus).includes(rawStatus as SupportTicketStatus)
    ? (rawStatus as SupportTicketStatus)
    : SupportTicketStatus.OPEN;
  const priority = Object.values(SupportTicketPriority).includes(rawPriority as SupportTicketPriority)
    ? (rawPriority as SupportTicketPriority)
    : SupportTicketPriority.NORMAL;

  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      status,
      priority,
      assignedTo: text(formData, "assignedTo") || null,
      resolvedAt: status === "RESOLVED" || status === "CLOSED" ? new Date() : null,
    },
  });
  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "SUPPORT_TICKET_UPDATED",
      entityType: "SupportTicket",
      entityId: ticket.id,
      newData: JSON.stringify({ status, priority }),
    },
  });
  revalidatePath("/admin/support");
  redirect("/admin/support?updated=1");
}
