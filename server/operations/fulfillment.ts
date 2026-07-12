import { prisma } from "@/server/db/client";
import { decryptActivationCode } from "@/server/operations/activation-code-vault";

const activeItemStatuses = ["RESERVED", "ASSIGNED", "PACKED", "SHIPPED", "DELIVERED"] as const;

export async function reserveDevicesForOrder(orderId: string, actorUserId?: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) throw new Error("Order not found.");

  const pendingItems = order.items.filter((item) => !item.deviceId || item.status === "PENDING" || item.status === "RELEASED");
  if (!pendingItems.length) return order;

  const availableDevices = await prisma.device.findMany({
    where: {
      inventoryStatus: "AVAILABLE",
      verificationStatus: "FULLY_VERIFIED",
      orderItems: { none: { status: { in: [...activeItemStatuses] } } },
    },
    include: { batch: true },
    orderBy: [{ createdAt: "asc" }],
    take: pendingItems.length,
  });
  if (availableDevices.length < pendingItems.length) {
    await prisma.order.update({ where: { id: orderId }, data: { fulfillmentStatus: "AWAITING_STOCK" } });
    throw new Error("No hay stock verificado suficiente para reservar este pedido.");
  }

  await prisma.$transaction(async (tx) => {
    for (const [index, item] of pendingItems.entries()) {
      const device = availableDevices[index];
      await tx.orderItem.update({
        where: { id: item.id },
        data: { deviceId: device.id, status: "RESERVED" },
      });
      await tx.device.update({
        where: { id: device.id },
        data: {
          inventoryStatus: "RESERVED",
          status: "RESERVED",
          reservedAt: new Date(),
          soldAt: new Date(),
        },
      });
    }
    await tx.order.update({ where: { id: orderId }, data: { fulfillmentStatus: "RESERVED" } });
    await tx.auditLog.create({
      data: {
        actorUserId,
        action: "ORDER_DEVICES_RESERVED",
        entityType: "Order",
        entityId: orderId,
        newData: JSON.stringify({
          orderNumber: order.orderNumber,
          quantity: pendingItems.length,
          strategy: "FIFO_BY_CREATED_AT",
          devices: availableDevices.map((device) => ({
            publicCode: device.publicCode,
            batch: device.batch?.internalReference,
          })),
        }),
      },
    });
  });

  return prisma.order.findUniqueOrThrow({ where: { id: orderId } });
}

export async function releaseOrderDevices(orderId: string, actorUserId?: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) throw new Error("Order not found.");
  const assignedItems = order.items.filter((item) => item.deviceId);

  await prisma.$transaction(async (tx) => {
    for (const item of assignedItems) {
      await tx.orderItem.update({ where: { id: item.id }, data: { deviceId: null, status: "RELEASED" } });
      if (item.deviceId) {
        await tx.device.update({
          where: { id: item.deviceId },
          data: { inventoryStatus: "AVAILABLE", status: "UNASSIGNED", reservedAt: null, soldAt: null },
        });
      }
    }
    await tx.order.update({ where: { id: orderId }, data: { fulfillmentStatus: "CONFIRMED" } });
    await tx.auditLog.create({
      data: {
        actorUserId,
        action: "ORDER_DEVICES_RELEASED",
        entityType: "Order",
        entityId: orderId,
        newData: JSON.stringify({ orderNumber: order.orderNumber, quantity: assignedItems.length }),
      },
    });
  });
}

export async function revealPackingActivationCodes(orderId: string, actorUserId?: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { device: { include: { batch: true } } }, orderBy: { createdAt: "asc" } } },
  });
  if (!order) throw new Error("Order not found.");

  const rows = order.items.map((item) => {
    let activationCode: string | null = null;
    if (item.device?.activationCodeEncrypted) {
      try {
        activationCode = decryptActivationCode(item.device.activationCodeEncrypted);
      } catch {
        activationCode = null;
      }
    }
    return {
      itemId: item.id,
      status: item.status,
      publicCode: item.device?.publicCode ?? null,
      publicUrl: item.device?.publicUrl ?? null,
      batchReference: item.device?.batch?.internalReference ?? null,
      verificationStatus: item.device?.verificationStatus ?? null,
      activationCode,
    };
  });

  await prisma.auditLog.create({
    data: {
      actorUserId,
      action: "ACTIVATION_CODE_REVEALED_FOR_PACKING",
      entityType: "Order",
      entityId: orderId,
      newData: JSON.stringify({
        orderNumber: order.orderNumber,
        publicCodes: rows.map((row) => row.publicCode).filter(Boolean),
      }),
    },
  });

  return { order, rows };
}

export async function completePacking(orderId: string, checklist: Record<string, boolean>, actorUserId?: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) throw new Error("Order not found.");
  const required = [
    "quantityCorrect",
    "verifiedDevices",
    "qrChecked",
    "nfcChecked",
    "activationCodesChecked",
    "cardsIncluded",
    "packageClosed",
    "addressConfirmed",
    "paymentConfirmed",
  ];
  const missing = required.filter((key) => !checklist[key]);
  if (missing.length) throw new Error(`Checklist incompleto: ${missing.join(", ")}`);

  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      await tx.orderItem.update({ where: { id: item.id }, data: { status: "PACKED" } });
      if (item.deviceId) {
        await tx.device.update({ where: { id: item.deviceId }, data: { inventoryStatus: "PACKING", packedAt: new Date() } });
      }
    }
    await tx.order.update({
      where: { id: orderId },
      data: { fulfillmentStatus: "READY_TO_SHIP", packedAt: new Date() },
    });
    await tx.auditLog.create({
      data: {
        actorUserId,
        action: "ORDER_PACKING_COMPLETED",
        entityType: "Order",
        entityId: orderId,
        newData: JSON.stringify({ orderNumber: order.orderNumber, checklist }),
      },
    });
  });
}
