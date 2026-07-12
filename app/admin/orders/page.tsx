import Link from "next/link";
import { Badge, statusTone } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/formatting/format";
import { formatCLP } from "@/lib/marketing/pricing";
import { prisma } from "@/server/db/client";

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    include: { items: true, payments: true, shipments: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="grid gap-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pedidos</h1>
          <p className="mt-1 text-sm text-neutral-600">Ventas manuales y leads convertidos a operacion.</p>
        </div>
        <ButtonLink href="/admin/orders/new">Crear pedido</ButtonLink>
      </header>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-[1080px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Pedido</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Comuna</th>
                <th className="px-4 py-3">Pack</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Pago</th>
                <th className="px-4 py-3">Operacion</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 font-medium">
                    <Link className="text-[var(--brand-primary-dark)] underline-offset-4 hover:underline" href={`/admin/orders/${order.id}`}>
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{order.customerName}</td>
                  <td className="px-4 py-3">{order.phone}</td>
                  <td className="px-4 py-3">{order.comuna}</td>
                  <td className="px-4 py-3">Pack {order.pack}</td>
                  <td className="px-4 py-3">{formatCLP(order.total)}</td>
                  <td className="px-4 py-3"><Badge tone={statusTone(order.paymentStatus)}>{order.paymentStatus}</Badge></td>
                  <td className="px-4 py-3"><Badge tone={statusTone(order.fulfillmentStatus)}>{order.fulfillmentStatus}</Badge></td>
                  <td className="px-4 py-3">{order.items.length}</td>
                  <td className="px-4 py-3">{formatDate(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!orders.length ? <p className="p-4 text-sm text-neutral-600">Todavia no hay pedidos.</p> : null}
      </Card>
    </div>
  );
}
