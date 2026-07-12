import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCLP } from "@/lib/marketing/pricing";
import { prisma } from "@/server/db/client";

function Metric({
  label,
  value,
  href,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  href?: string;
  tone?: Parameters<typeof Badge>[0]["tone"];
}) {
  const content = (
    <Card className="h-full">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase text-neutral-500">{label}</p>
        <Badge tone={tone}>{String(value)}</Badge>
      </div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </Card>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default async function OperationsDashboardPage() {
  const [
    newLeads,
    newOrders,
    pendingPayments,
    reportedPayments,
    awaitingStock,
    reservedOrders,
    packingOrders,
    readyToShip,
    shippedOrders,
    productionBatches,
    transitBatches,
    pendingVerification,
    errorUnits,
    availableStock,
    pendingActivation,
    openTickets,
    paidRevenue,
  ] = await Promise.all([
    prisma.purchaseIntent.count({ where: { status: "NEW" } }),
    prisma.order.count({ where: { fulfillmentStatus: "NEW" } }),
    prisma.order.count({ where: { paymentStatus: "PENDING" } }),
    prisma.order.count({ where: { paymentStatus: "PAYMENT_REPORTED" } }),
    prisma.order.count({ where: { fulfillmentStatus: "AWAITING_STOCK" } }),
    prisma.order.count({ where: { fulfillmentStatus: "RESERVED" } }),
    prisma.order.count({ where: { fulfillmentStatus: "PACKING" } }),
    prisma.order.count({ where: { fulfillmentStatus: "READY_TO_SHIP" } }),
    prisma.order.count({ where: { fulfillmentStatus: "SHIPPED" } }),
    prisma.batch.count({ where: { status: { in: ["SENT_TO_SUPPLIER", "SAMPLE_PRODUCTION", "MASS_PRODUCTION"] } } }),
    prisma.batch.count({ where: { status: { in: ["SAMPLE_SHIPPED", "SHIPPED"] } } }),
    prisma.device.count({ where: { inventoryStatus: "PENDING_VERIFICATION" } }),
    prisma.device.count({
      where: { verificationStatus: { in: ["QR_MISMATCH", "NFC_MISMATCH", "UID_MISMATCH", "DAMAGED", "MISSING", "REJECTED"] } },
    }),
    prisma.device.count({ where: { inventoryStatus: "AVAILABLE" } }),
    prisma.device.count({ where: { inventoryStatus: { in: ["DELIVERED", "SHIPPED"] }, activatedAt: null } }),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER"] } } }),
    prisma.order.aggregate({ where: { paymentStatus: "PAID" }, _sum: { total: true } }),
  ]);

  const alerts = [
    pendingPayments ? `${pendingPayments} pedidos con pago pendiente.` : null,
    reportedPayments ? `${reportedPayments} pagos reportados requieren revision.` : null,
    awaitingStock ? `${awaitingStock} pedidos esperan stock.` : null,
    errorUnits ? `${errorUnits} unidades tienen error de verificacion.` : null,
    pendingActivation ? `${pendingActivation} unidades entregadas o enviadas no activadas.` : null,
  ].filter(Boolean);

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Operaciones</h1>
        <p className="mt-1 text-sm text-neutral-600">Tablero diario para fabricar, vender, preparar y dar soporte.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Leads nuevos" value={newLeads} href="/admin/leads" tone={newLeads ? "blue" : "neutral"} />
        <Metric label="Pedidos nuevos" value={newOrders} href="/admin/orders" tone={newOrders ? "blue" : "neutral"} />
        <Metric label="Pagos pendientes" value={pendingPayments} href="/admin/orders" tone={pendingPayments ? "amber" : "neutral"} />
        <Metric label="Pagos reportados" value={reportedPayments} href="/admin/orders" tone={reportedPayments ? "blue" : "neutral"} />
        <Metric label="Esperando stock" value={awaitingStock} href="/admin/orders" tone={awaitingStock ? "amber" : "neutral"} />
        <Metric label="Pedidos reservados" value={reservedOrders} href="/admin/orders" tone={reservedOrders ? "blue" : "neutral"} />
        <Metric label="Para packing" value={packingOrders + readyToShip} href="/admin/orders" tone={packingOrders + readyToShip ? "blue" : "neutral"} />
        <Metric label="Pedidos enviados" value={shippedOrders} href="/admin/orders" tone={shippedOrders ? "amber" : "neutral"} />
        <Metric label="Lotes en produccion" value={productionBatches} href="/admin/production" tone={productionBatches ? "amber" : "neutral"} />
        <Metric label="Lotes en transito" value={transitBatches} href="/admin/production" tone={transitBatches ? "amber" : "neutral"} />
        <Metric label="Pendientes verificacion" value={pendingVerification} href="/admin/inventory" tone={pendingVerification ? "amber" : "neutral"} />
        <Metric label="Unidades con error" value={errorUnits} href="/admin/inventory" tone={errorUnits ? "red" : "neutral"} />
        <Metric label="Stock disponible" value={availableStock} href="/admin/inventory?status=AVAILABLE" tone={availableStock ? "green" : "amber"} />
        <Metric label="Activaciones pendientes" value={pendingActivation} href="/admin/inventory" tone={pendingActivation ? "amber" : "neutral"} />
        <Metric label="Tickets abiertos" value={openTickets} href="/admin/support" tone={openTickets ? "red" : "neutral"} />
        <Metric label="Ventas pagadas" value={formatCLP(paidRevenue._sum.total ?? 0)} href="/admin/orders" tone="green" />
      </div>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">Alertas</h2>
        {alerts.length ? (
          <ul className="grid gap-2 text-sm text-neutral-700">
            {alerts.map((alert) => (
              <li key={alert} className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900">
                {alert}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-600">Sin alertas operativas criticas en este momento.</p>
        )}
      </Card>
    </div>
  );
}
