"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { CommercialStatus } from "@prisma/client";
import { requireRole } from "@/lib/auth/session";
import { parseBooleanFormValue } from "@/lib/formatting/format";
import {
  commitRbdImportRows,
  parseRbdImportFile,
  previewRbdImportWithDatabase,
  type RbdImportPreviewRow,
} from "@/server/mime/importer";
import {
  cancelMimeScrapeJob,
  createMimeScrapeJobForRbds,
  createSampleMimeScrapeJob,
  pauseMimeScrapeJob,
  resumeMimeScrapeJob,
  runMimeScrapeJob,
} from "@/server/mime/worker";
import { parseRbd } from "@/server/mime/normalization";
import { prisma } from "@/server/db/client";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "SUPPORT"] as const;

export async function createMimeSampleJobAction() {
  await requireRole([...ADMIN_ROLES]);
  const job = await createSampleMimeScrapeJob();
  redirect(`/admin/mime?job=${job.id}`);
}

export async function createSingleRbdScrapeJobAction(formData: FormData) {
  await requireRole([...ADMIN_ROLES]);
  const rbd = parseRbd(formData.get("rbd")?.toString());
  if (!rbd) redirect("/admin/mime?error=invalid_rbd");
  const job = await createMimeScrapeJobForRbds([rbd], {}, "SINGLE_RBD");
  redirect(`/admin/mime?job=${job.id}`);
}

export async function runMimeJobAction(formData: FormData) {
  await requireRole([...ADMIN_ROLES]);
  const jobId = String(formData.get("jobId") ?? "");
  if (!jobId) redirect("/admin/mime?error=missing_job");
  await runMimeScrapeJob(jobId);
  revalidatePath("/admin/mime");
  redirect(`/admin/mime?job=${jobId}`);
}

export async function pauseMimeJobAction(formData: FormData) {
  await requireRole([...ADMIN_ROLES]);
  const jobId = String(formData.get("jobId") ?? "");
  await pauseMimeScrapeJob(jobId);
  redirect(`/admin/mime?job=${jobId}`);
}

export async function resumeMimeJobAction(formData: FormData) {
  await requireRole([...ADMIN_ROLES]);
  const jobId = String(formData.get("jobId") ?? "");
  await resumeMimeScrapeJob(jobId);
  redirect(`/admin/mime?job=${jobId}`);
}

export async function cancelMimeJobAction(formData: FormData) {
  await requireRole([...ADMIN_ROLES]);
  const jobId = String(formData.get("jobId") ?? "");
  await cancelMimeScrapeJob(jobId);
  redirect(`/admin/mime?job=${jobId}`);
}

export async function previewRbdImportAction(formData: FormData) {
  await requireRole([...ADMIN_ROLES]);
  const fileEntry = formData.get("file");
  const csv = String(formData.get("csv") ?? "");
  const file = fileEntry instanceof File ? fileEntry : new File([], "manual.csv");
  const parsed = await parseRbdImportFile(file, csv);
  const preview = await previewRbdImportWithDatabase(parsed.rows, parsed.columnErrors);
  const job = await prisma.scrapeJob.create({
    data: {
      type: "IMPORTED_RBDS",
      status: "DRAFT",
      totalItems: preview.totalRows,
      skippedItems: preview.skippedRows,
      failedItems: preview.errorRows,
      configuration: JSON.stringify({
        filename: file.name || "manual.csv",
        preview,
      }),
    },
  });
  redirect(`/admin/mime/imports?preview=${job.id}`);
}

export async function confirmRbdImportAction(formData: FormData) {
  await requireRole([...ADMIN_ROLES]);
  const jobId = String(formData.get("jobId") ?? "");
  const job = await prisma.scrapeJob.findUnique({ where: { id: jobId } });
  if (!job) redirect("/admin/mime/imports?error=preview_not_found");

  const configuration = JSON.parse(job.configuration) as { preview?: { rows?: RbdImportPreviewRow[] } };
  const rows = configuration.preview?.rows ?? [];
  const result = await commitRbdImportRows(rows);
  await prisma.scrapeJob.update({
    where: { id: job.id },
    data: {
      status: result.errorRows ? "COMPLETED_WITH_ERRORS" : "COMPLETED",
      processedItems: result.createdRows + result.updatedRows + result.skippedRows + result.errorRows,
      successfulItems: result.createdRows + result.updatedRows,
      skippedItems: result.skippedRows,
      failedItems: result.errorRows,
      finishedAt: new Date(),
      configuration: JSON.stringify({ ...configuration, importResult: result }),
    },
  });
  redirect(`/admin/mime/imports?imported=${job.id}`);
}

export async function updateCommercialStatusAction(formData: FormData) {
  await requireRole([...ADMIN_ROLES]);
  const organizationId = String(formData.get("organizationId") ?? "");
  const status = String(formData.get("commercialStatus") ?? "SIN_REVISAR") as CommercialStatus;
  await prisma.organization.update({
    where: { id: organizationId },
    data: { commercialStatus: status, doNotContact: status === "NO_CONTACTAR" ? true : undefined },
  });
  revalidatePath("/admin/mime");
  revalidatePath("/admin/mime/pipeline");
}

export async function updateDoNotContactAction(formData: FormData) {
  await requireRole([...ADMIN_ROLES]);
  const organizationId = String(formData.get("organizationId") ?? "");
  const establishmentId = String(formData.get("establishmentId") ?? "") || null;
  const doNotContact = parseBooleanFormValue(formData.get("doNotContact"));
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      doNotContact,
      commercialStatus: doNotContact ? "NO_CONTACTAR" : "SIN_REVISAR",
    },
  });
  if (establishmentId) {
    await prisma.contact.updateMany({
      where: { establishmentId },
      data: { doNotContact },
    });
  }
  revalidatePath("/admin/mime/establishments");
}

export async function addCommercialActivityAction(formData: FormData) {
  await requireRole([...ADMIN_ROLES]);
  const organizationId = String(formData.get("organizationId") ?? "");
  const contactId = String(formData.get("contactId") ?? "") || null;
  await prisma.activity.create({
    data: {
      organizationId,
      contactId,
      type: String(formData.get("type") ?? "NOTE"),
      direction: String(formData.get("direction") ?? "INTERNAL"),
      subject: String(formData.get("subject") ?? ""),
      body: String(formData.get("body") ?? ""),
      occurredAt: new Date(),
    },
  });
  revalidatePath("/admin/mime/establishments");
}

export async function deleteDemoMimeRecordsAction() {
  await requireRole([...ADMIN_ROLES]);
  const demoEstablishments = await prisma.establishment.findMany({
    where: { source: "SEED_LOCAL_MIME_SAMPLE" },
    select: { id: true },
  });
  const establishmentIds = demoEstablishments.map((establishment) => establishment.id);

  if (!establishmentIds.length) {
    redirect("/admin/mime?demo=none");
  }

  const demoOrganizations = await prisma.organization.findMany({
    where: { establishmentId: { in: establishmentIds } },
    select: { id: true },
  });
  const organizationIds = demoOrganizations.map((organization) => organization.id);

  await prisma.$transaction([
    prisma.activity.deleteMany({ where: { organizationId: { in: organizationIds } } }),
    prisma.opportunity.deleteMany({ where: { organizationId: { in: organizationIds } } }),
    prisma.organization.deleteMany({ where: { id: { in: organizationIds } } }),
    prisma.contact.deleteMany({ where: { establishmentId: { in: establishmentIds } } }),
    prisma.scrapeAttempt.deleteMany({ where: { establishmentId: { in: establishmentIds } } }),
    prisma.establishmentChange.deleteMany({ where: { establishmentId: { in: establishmentIds } } }),
    prisma.suppression.deleteMany({ where: { establishmentId: { in: establishmentIds } } }),
    prisma.establishment.deleteMany({ where: { id: { in: establishmentIds } } }),
    prisma.scrapeJob.deleteMany({ where: { configuration: { contains: "mime-seed-sample" } } }),
  ]);

  revalidatePath("/admin/mime");
  revalidatePath("/admin/mime/establishments");
  redirect(`/admin/mime?demo=deleted&count=${establishmentIds.length}`);
}
