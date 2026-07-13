import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/server/db/client";
import { sha256 } from "@/server/operations/manufacturer-export";
import {
  buildSampleChecksumsText,
  buildSampleInstructionsEnglish,
  buildSampleManufacturerWorkbook,
  buildSampleProductionDataCsv,
  buildSampleQrZip,
  buildSampleSupplierPackageZip,
  buildSupplierReturnTemplateCsv,
  decodeSampleUnits,
  SAMPLE_BATCH_REFERENCE,
} from "@/server/operations/sample-batch-preview";

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

export async function GET(request: Request, { params }: { params: Promise<{ artifact: string }> }) {
  const user = await requireRole(["ADMIN", "SUPER_ADMIN", "SUPPORT"]);
  const { artifact } = await params;
  const unitsParam = new URL(request.url).searchParams.get("units") ?? "";
  const units = decodeSampleUnits(unitsParam);
  let body: Buffer | string;
  let contentType: string;
  let filename: string;

  if (artifact === "manufacturer.xlsx") {
    body = await buildSampleManufacturerWorkbook(units);
    contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    filename = "sample-helplis-001-manufacturer.xlsx";
  } else if (artifact === "production-data.csv") {
    body = buildSampleProductionDataCsv(units);
    contentType = "text/csv; charset=utf-8";
    filename = "sample-helplis-001-production-data.csv";
  } else if (artifact === "instructions-en.txt") {
    body = buildSampleInstructionsEnglish();
    contentType = "text/plain; charset=utf-8";
    filename = "sample-helplis-001-instructions-en.txt";
  } else if (artifact === "checksums-sha256.txt") {
    body = await buildSampleChecksumsText(units);
    contentType = "text/plain; charset=utf-8";
    filename = "sample-helplis-001-checksums-sha256.txt";
  } else if (artifact === "supplier-package.zip") {
    body = await buildSampleSupplierPackageZip(units);
    contentType = "application/zip";
    filename = "sample-helplis-001-supplier-package.zip";
  } else if (artifact === "qr-png.zip" || artifact === "qr-svg.zip") {
    const format = artifact === "qr-png.zip" ? "png" : "svg";
    body = await buildSampleQrZip(units, format);
    contentType = "application/zip";
    filename = `sample-helplis-001-qr-${format}.zip`;
  } else if (artifact === "supplier-return.csv") {
    body = buildSupplierReturnTemplateCsv(units);
    contentType = "text/csv; charset=utf-8";
    filename = "sample-helplis-001-supplier-return-template.csv";
  } else {
    return NextResponse.json({ ok: false }, { status: 404, headers: { "cache-control": "no-store" } });
  }

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "SAMPLE_PREVIEW_ARTIFACT_DOWNLOADED",
      entityType: "SampleBatchPreview",
      entityId: SAMPLE_BATCH_REFERENCE,
      newData: JSON.stringify({
        artifact,
        filename,
        checksum: sha256(body),
        quantity: units.length,
        unitsHash: sha256(unitsParam),
        persistedDevices: false,
        publicCodesLogged: false,
      }),
    },
  });

  return artifactResponse(body, contentType, filename);
}
