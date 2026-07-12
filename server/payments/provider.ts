import { PaymentMethod, PaymentStatus, type Payment } from "@prisma/client";
import { prisma } from "@/server/db/client";

export type CreatePaymentInput = {
  orderId: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  externalReference?: string | null;
  proofUrl?: string | null;
  reportedAt?: Date | null;
  notes?: string | null;
  createdBy?: string;
};

export interface PaymentProvider {
  createPayment(input: CreatePaymentInput): Promise<Payment>;
  createPaymentLink(orderId: string): Promise<{ url: string | null; provider: string }>;
  verifyPayment(paymentId: string): Promise<Payment>;
  refundPayment(paymentId: string, amount?: number): Promise<Payment>;
  handleWebhook(payload: unknown): Promise<void>;
}

export class ManualPaymentProvider implements PaymentProvider {
  async createPayment(input: CreatePaymentInput) {
    const now = new Date();
    const payment = await prisma.payment.create({
      data: {
        orderId: input.orderId,
        provider: "MANUAL",
        method: input.method,
        amount: Math.round(input.amount),
        status: input.status,
        externalReference: input.externalReference,
        proofUrl: input.proofUrl,
        reportedAt: input.reportedAt ?? (input.status === "REPORTED" || input.status === "APPROVED" ? now : null),
        approvedAt: input.status === "APPROVED" ? now : null,
        rejectedAt: input.status === "REJECTED" ? now : null,
        notes: input.notes,
        createdBy: input.createdBy,
      },
    });

    await this.syncOrderPaymentStatus(input.orderId);
    await prisma.auditLog.create({
      data: {
        actorUserId: input.createdBy,
        action: "MANUAL_PAYMENT_CREATED",
        entityType: "Payment",
        entityId: payment.id,
        newData: JSON.stringify({ orderId: input.orderId, amount: payment.amount, status: payment.status }),
      },
    });
    return payment;
  }

  async createPaymentLink(orderId: string) {
    return { url: null, provider: `manual:${orderId}` };
  }

  async verifyPayment(paymentId: string) {
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: { status: "APPROVED", approvedAt: new Date(), rejectedAt: null },
    });
    await this.syncOrderPaymentStatus(payment.orderId);
    return payment;
  }

  async refundPayment(paymentId: string, amount?: number) {
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: { status: "REFUNDED", notes: amount ? `Refund manual por ${amount}` : undefined },
    });
    await this.syncOrderPaymentStatus(payment.orderId);
    return payment;
  }

  async handleWebhook() {
    return undefined;
  }

  private async syncOrderPaymentStatus(orderId: string) {
    const payments = await prisma.payment.findMany({ where: { orderId } });
    const approved = payments.filter((payment) => payment.status === "APPROVED").reduce((sum, payment) => sum + payment.amount, 0);
    const reported = payments.some((payment) => payment.status === "REPORTED");
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return;
    if (approved >= order.total) {
      await prisma.order.update({ where: { id: orderId }, data: { paymentStatus: "PAID", paidAt: new Date() } });
    } else if (reported) {
      await prisma.order.update({ where: { id: orderId }, data: { paymentStatus: "PAYMENT_REPORTED" } });
    }
  }
}
