import { ShipmentStatus, type Shipment } from "@prisma/client";
import { prisma } from "@/server/db/client";

export type CreateShipmentInput = {
  orderId: string;
  carrier?: string | null;
  service?: string | null;
  trackingNumber?: string | null;
  cost?: number;
  status?: ShipmentStatus;
  shippedAt?: Date | null;
  estimatedDeliveryAt?: Date | null;
  deliveredAt?: Date | null;
  notes?: string | null;
  actorUserId?: string;
};

export interface ShippingProvider {
  quote(orderId: string): Promise<{ amount: number | null; currency: string; provider: string }>;
  createShipment(input: CreateShipmentInput): Promise<Shipment>;
  getTracking(shipmentId: string): Promise<Shipment | null>;
  cancelShipment(shipmentId: string): Promise<Shipment>;
}

export class ManualShippingProvider implements ShippingProvider {
  async quote() {
    return { amount: null, currency: "CLP", provider: "MANUAL" };
  }

  async createShipment(input: CreateShipmentInput) {
    const order = await prisma.order.findUnique({ where: { id: input.orderId } });
    if (!order) throw new Error("Order not found.");
    const shipment = await prisma.shipment.create({
      data: {
        orderId: input.orderId,
        provider: "MANUAL",
        carrier: input.carrier,
        service: input.service,
        trackingNumber: input.trackingNumber,
        cost: Math.max(0, Math.round(input.cost ?? 0)),
        status: input.status ?? "DRAFT",
        shippedAt: input.shippedAt,
        estimatedDeliveryAt: input.estimatedDeliveryAt,
        deliveredAt: input.deliveredAt,
        notes: input.notes,
      },
    });

    await prisma.order.update({
      where: { id: input.orderId },
      data: {
        carrier: shipment.carrier,
        trackingNumber: shipment.trackingNumber,
        shippingCost: shipment.cost,
        total: order.subtotal + shipment.cost,
        fulfillmentStatus:
          shipment.status === "DELIVERED" ? "DELIVERED" : shipment.status === "SHIPPED" || shipment.status === "IN_TRANSIT" ? "SHIPPED" : undefined,
        shippedAt: shipment.shippedAt,
        deliveredAt: shipment.deliveredAt,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        action: "MANUAL_SHIPMENT_CREATED",
        entityType: "Shipment",
        entityId: shipment.id,
        newData: JSON.stringify({
          orderId: input.orderId,
          carrier: shipment.carrier,
          trackingNumber: shipment.trackingNumber,
          status: shipment.status,
        }),
      },
    });
    return shipment;
  }

  async getTracking(shipmentId: string) {
    return prisma.shipment.findUnique({ where: { id: shipmentId } });
  }

  async cancelShipment(shipmentId: string) {
    return prisma.shipment.update({ where: { id: shipmentId }, data: { status: "CANCELLED" } });
  }
}
