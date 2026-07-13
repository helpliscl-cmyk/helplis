import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import {
  buildSampleManufacturerWorkbook,
  buildSampleQrZip,
  buildSupplierReturnTemplateCsv,
  decodeSampleUnits,
} from "@/server/operations/sample-batch-preview";

export async function GET(request: Request, { params }: { params: Promise<{ artifact: string }> }) {
  await requireRole(["ADMIN", "SUPER_ADMIN", "SUPPORT"]);
  const { artifact } = await params;
  const unitsParam = new URL(request.url).searchParams.get("units") ?? "";
  const units = decodeSampleUnits(unitsParam);

  if (artifact === "manufacturer.xlsx") {
    const workbook = await buildSampleManufacturerWorkbook(units);
    return new NextResponse(new Uint8Array(workbook), {
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": 'attachment; filename="sample-helplis-001-manufacturer.xlsx"',
        "cache-control": "no-store",
      },
    });
  }

  if (artifact === "qr-png.zip" || artifact === "qr-svg.zip") {
    const format = artifact === "qr-png.zip" ? "png" : "svg";
    const zip = await buildSampleQrZip(units, format);
    return new NextResponse(new Uint8Array(zip), {
      headers: {
        "content-type": "application/zip",
        "content-disposition": `attachment; filename="sample-helplis-001-qr-${format}.zip"`,
        "cache-control": "no-store",
      },
    });
  }

  if (artifact === "supplier-return.csv") {
    const csv = buildSupplierReturnTemplateCsv(units);
    return new NextResponse(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="sample-helplis-001-supplier-return-template.csv"',
        "cache-control": "no-store",
      },
    });
  }

  return NextResponse.json({ ok: false }, { status: 404, headers: { "cache-control": "no-store" } });
}
