import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/server/db/client";
import { verificationReportCsv } from "@/server/operations/physical-verification";

export async function GET(_: Request, { params }: { params: Promise<{ batchId: string }> }) {
  await requireRole(["ADMIN", "SUPER_ADMIN", "SUPPORT"]);
  const { batchId } = await params;
  const batch = await prisma.batch.findUnique({ where: { id: batchId } });
  if (!batch) return NextResponse.json({ error: "Lote no encontrado" }, { status: 404 });

  const csv = await verificationReportCsv(batchId);
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${batch.internalReference}-verification-report.csv"`,
    },
  });
}
