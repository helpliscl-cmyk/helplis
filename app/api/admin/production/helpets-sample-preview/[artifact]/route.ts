import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/server/db/client";
import { sha256 } from "@/server/operations/manufacturer-export";
import {
  buildHelpetsChecksumsText,
  buildHelpetsInternalPackageZip,
  buildHelpetsProductionDataCsv,
  buildHelpetsSimplePackageFiles,
  buildHelpetsSimplePackageZip,
  buildHelpetsSupplierReturnTemplateCsv,
  buildHelpetsWorkbookBuffer,
  decodeHelpetsSampleUnits,
  helpetsConfirmationCodeForError,
  helpetsMessageToLeanne,
  helpetsSupplierInstructions,
  HELPETS_INTERNAL_EXPORT_NAME,
  HELPETS_SAMPLE_BATCH_REFERENCE,
  HELPETS_SIMPLE_EXPORT_NAME,
  type HelpetsSamplePreviewUnit,
} from "@/server/operations/helpets-sample";

function artifactResponse(body: Buffer | string, contentType: string, filename: string) {
  const payload = typeof body === "string" ? body : new Uint8Array(body);
  return new NextResponse(payload, {
    headers: {
      "content-type": contentType,
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}

async function simpleFile(units: HelpetsSamplePreviewUnit[], path: string) {
  const files = await buildHelpetsSimplePackageFiles(units);
  return files.find((file) => file.path === path) ?? null;
}

export async function GET(request: Request, { params }: { params: Promise<{ artifact: string }> }) {
  const user = await requireRole(["ADMIN", "SUPER_ADMIN", "SUPPORT"]);
  const { artifact } = await params;
  const unitsParam = new URL(request.url).searchParams.get("units") ?? "";
  let units: HelpetsSamplePreviewUnit[];
  try {
    units = decodeHelpetsSampleUnits(unitsParam);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        code: helpetsConfirmationCodeForError(error),
      },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }

  let body: Buffer | string;
  let contentType: string;
  let filename: string;

  if (artifact === "simple-package.zip") {
    body = await buildHelpetsSimplePackageZip(units);
    contentType = "application/zip";
    filename = `${HELPETS_SIMPLE_EXPORT_NAME}.zip`;
  } else if (artifact === "internal-package.zip") {
    body = await buildHelpetsInternalPackageZip(units);
    contentType = "application/zip";
    filename = `${HELPETS_INTERNAL_EXPORT_NAME}.zip`;
  } else if (artifact === "01-helpets-5-urls.xlsx") {
    body = await buildHelpetsWorkbookBuffer(units);
    contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    filename = "01-helpets-5-urls.xlsx";
  } else if (artifact === "02-helpets-5-urls.csv") {
    body = buildHelpetsProductionDataCsv(units);
    contentType = "text/csv; charset=utf-8";
    filename = "02-helpets-5-urls.csv";
  } else if (artifact === "09-message-to-leanne.txt") {
    body = helpetsMessageToLeanne();
    contentType = "text/plain; charset=utf-8";
    filename = "09-message-to-leanne.txt";
  } else if (artifact === "instructions-en.txt") {
    body = helpetsSupplierInstructions();
    contentType = "text/plain; charset=utf-8";
    filename = "helpets-instructions-en.txt";
  } else if (artifact === "supplier-return.csv") {
    body = buildHelpetsSupplierReturnTemplateCsv(units);
    contentType = "text/csv; charset=utf-8";
    filename = "helpets-supplier-return-template.csv";
  } else if (artifact === "checksums-sha256.txt") {
    body = await buildHelpetsChecksumsText(units, "internal");
    contentType = "text/plain; charset=utf-8";
    filename = "helpets-sample-checksums-sha256.txt";
  } else {
    const file = await simpleFile(units, artifact);
    if (!file) {
      return NextResponse.json({ ok: false }, { status: 404, headers: { "cache-control": "no-store" } });
    }
    body = file.data;
    contentType = artifact.endsWith(".svg")
      ? "image/svg+xml; charset=utf-8"
      : artifact.endsWith(".pdf")
        ? "application/pdf"
        : "application/octet-stream";
    filename = artifact;
  }

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "HELPETS_SAMPLE_PREVIEW_ARTIFACT_DOWNLOADED",
      entityType: "HelpetsSamplePreview",
      entityId: HELPETS_SAMPLE_BATCH_REFERENCE,
      newData: JSON.stringify({
        artifact,
        filename,
        checksum: sha256(body),
        quantity: units.length,
        unitsHash: sha256(unitsParam),
        persistedDevices: false,
        publicCodesLogged: false,
        activationCodeIncluded: false,
      }),
    },
  });

  return artifactResponse(body, contentType, filename);
}
