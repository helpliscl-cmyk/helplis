"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { InstitutionLeadStatus } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/server/db/client";

const institutionLeadSchema = z.object({
  institutionName: z.string().min(2),
  type: z.string().min(2),
  region: z.string().min(2),
  comuna: z.string().min(2),
  contactName: z.string().min(2),
  contactRole: z.string().optional(),
  phone: z.string().min(6),
  email: z.string().email(),
  estimatedQuantity: z.coerce.number().int().min(1),
  estimatedDate: z.string().optional(),
  interest: z.string().min(3),
  notes: z.string().optional(),
});

export async function createInstitutionLeadAction(formData: FormData) {
  const parsed = institutionLeadSchema.safeParse({
    institutionName: formData.get("institutionName"),
    type: formData.get("type"),
    region: formData.get("region"),
    comuna: formData.get("comuna"),
    contactName: formData.get("contactName"),
    contactRole: formData.get("contactRole") || undefined,
    phone: formData.get("phone"),
    email: formData.get("email"),
    estimatedQuantity: formData.get("estimatedQuantity"),
    estimatedDate: formData.get("estimatedDate") || undefined,
    interest: formData.get("interest"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) redirect("/instituciones/solicitar?error=invalid");

  const lead = await prisma.institutionLead.create({
    data: {
      ...parsed.data,
      estimatedDate: parsed.data.estimatedDate ? new Date(parsed.data.estimatedDate) : null,
      status: "NEW",
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "INSTITUTION_LEAD_CREATED",
      entityType: "InstitutionLead",
      entityId: lead.id,
      newData: JSON.stringify({ institutionName: lead.institutionName, estimatedQuantity: lead.estimatedQuantity }),
    },
  });

  redirect("/instituciones/solicitar?sent=1");
}

export async function updateInstitutionLeadStatusAction(formData: FormData) {
  const user = await requireRole(["ADMIN", "SUPER_ADMIN", "SUPPORT"]);
  const leadId = String(formData.get("leadId") ?? "");
  const rawStatus = String(formData.get("status") ?? "NEW");
  const status = Object.values(InstitutionLeadStatus).includes(rawStatus as InstitutionLeadStatus)
    ? (rawStatus as InstitutionLeadStatus)
    : InstitutionLeadStatus.NEW;
  const notes = String(formData.get("notes") ?? "").trim();

  const lead = await prisma.institutionLead.update({
    where: { id: leadId },
    data: { status, notes: notes || undefined },
  });
  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "INSTITUTION_LEAD_UPDATED",
      entityType: "InstitutionLead",
      entityId: lead.id,
      newData: JSON.stringify({ status, notes }),
    },
  });
  revalidatePath("/admin/institutions");
  redirect("/admin/institutions?updated=1");
}
