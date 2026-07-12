import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/server/db/client";
import { escapeCsvCell } from "@/server/operations/manufacturer-export";

export async function GET() {
  await requireRole(["ADMIN", "SUPER_ADMIN", "SUPPORT"]);
  const devices = await prisma.device.findMany({
    include: {
      batch: { select: { internalReference: true } },
      inventoryLocation: true,
      orderItems: { include: { order: { select: { orderNumber: true } } }, take: 1, orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });
  const header = [
    "public_code",
    "public_url",
    "nfc_uid",
    "batch_reference",
    "order_number",
    "inventory_status",
    "verification_status",
    "location",
    "updated_at",
  ];
  const csv = [
    header.join(","),
    ...devices.map((device) =>
      [
        device.publicCode,
        device.publicUrl,
        device.nfcUid ?? "",
        device.batch?.internalReference ?? "",
        device.orderItems[0]?.order.orderNumber ?? "",
        device.inventoryStatus,
        device.verificationStatus,
        device.inventoryLocation?.name ?? "",
        device.updatedAt.toISOString(),
      ]
        .map(escapeCsvCell)
        .join(","),
    ),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": "attachment; filename=\"helplis-inventory.csv\"",
    },
  });
}
