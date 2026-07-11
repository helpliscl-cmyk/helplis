import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/server/db/client";

export async function GET(request: Request) {
  await requireRole(["ADMIN", "SUPER_ADMIN", "SUPPORT"]);
  const url = new URL(request.url);
  const batchId = url.searchParams.get("batchId");
  if (!batchId) return NextResponse.json({ error: "batchId requerido" }, { status: 400 });

  const devices = await prisma.device.findMany({
    where: { batchId },
    orderBy: { publicCode: "asc" },
    select: {
      publicCode: true,
      publicUrl: true,
      nfcUid: true,
      productType: true,
      status: true,
      createdAt: true,
    },
  });

  const header = "publicCode,publicUrl,nfcUid,productType,status,createdAt";
  const rows = devices.map((device) =>
    [
      device.publicCode,
      device.publicUrl,
      device.nfcUid ?? "",
      device.productType,
      device.status,
      device.createdAt.toISOString(),
    ]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(","),
  );

  return new NextResponse([header, ...rows].join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="helplis-batch-${batchId}.csv"`,
    },
  });
}
