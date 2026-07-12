import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderFulfillmentStatus, OrderPaymentStatus } from "@prisma/client";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { updateOrderAction } from "@/features/orders/actions";
import { formatDate } from "@/lib/formatting/format";
import { HELPLIS_PACKS, formatCLP } from "@/lib/marketing/pricing";
import { prisma } from "@/server/db/client";

export default async function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      lead: true,
      items: { include: { device: { include: { batch: true } } }, orderBy: { createdAt: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
      shipments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!order) notFound();

  return (
    <div className="grid gap-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link className="text-sm text-[var(--brand-primary-dark)] underline-offset-4 hover:underline" href="/admin/orders">
            Volver a pedidos
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-neutral-600">{order.customerName} · {formatCLP(order.total)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={statusTone(order.paymentStatus)}>{order.paymentStatus}</Badge>
          <Badge tone={statusTone(order.fulfillmentStatus)}>{order.fulfillmentStatus}</Badge>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-4">
        <Card><p className="text-xs uppercase text-neutral-500">Subtotal</p><p className="mt-1 text-xl font-semibold">{formatCLP(order.subtotal)}</p></Card>
        <Card><p className="text-xs uppercase text-neutral-500">Envio</p><p className="mt-1 text-xl font-semibold">{formatCLP(order.shippingCost)}</p></Card>
        <Card><p className="text-xs uppercase text-neutral-500">Total</p><p className="mt-1 text-xl font-semibold">{formatCLP(order.total)}</p></Card>
        <Card><p className="text-xs uppercase text-neutral-500">Unidades</p><p className="mt-1 text-xl font-semibold">{order.quantity}</p></Card>
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Cliente y estado</h2>
        <form action={updateOrderAction} className="grid gap-4">
          <input type="hidden" name="orderId" value={order.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre">
              <Input name="customerName" defaultValue={order.customerName} />
            </Field>
            <Field label="WhatsApp">
              <Input name="phone" defaultValue={order.phone} />
            </Field>
            <Field label="Correo">
              <Input name="email" defaultValue={order.email ?? ""} />
            </Field>
            <Field label="Region">
              <Input name="region" defaultValue={order.region} />
            </Field>
            <Field label="Comuna">
              <Input name="comuna" defaultValue={order.comuna} />
            </Field>
            <Field label="Pack">
              <Select name="pack" defaultValue={order.pack}>
                {HELPLIS_PACKS.map((pack) => (
                  <option key={pack.id} value={pack.id}>
                    {pack.name} · {formatCLP(pack.totalPrice)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Direccion">
              <Input name="address" defaultValue={order.address ?? ""} />
            </Field>
            <Field label="Costo envio manual">
              <Input name="shippingCost" type="number" min={0} defaultValue={order.shippingCost} />
            </Field>
            <Field label="Estado pago">
              <Select name="paymentStatus" defaultValue={order.paymentStatus}>
                {Object.values(OrderPaymentStatus).map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </Select>
            </Field>
            <Field label="Estado operativo">
              <Select name="fulfillmentStatus" defaultValue={order.fulfillmentStatus}>
                {Object.values(OrderFulfillmentStatus).map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Notas direccion">
            <Textarea name="addressNotes" defaultValue={order.addressNotes ?? ""} />
          </Field>
          <Field label="Notas internas">
            <Textarea name="notes" defaultValue={order.notes ?? ""} />
          </Field>
          <Button type="submit">Guardar pedido</Button>
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-neutral-100 p-4">
          <h2 className="text-lg font-semibold">Unidades</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[820px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Pulsera</th>
                <th className="px-4 py-3">Lote</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Precio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {order.items.map((item, index) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3">{item.device?.publicCode ?? "Pendiente"}</td>
                  <td className="px-4 py-3">{item.device?.batch?.internalReference ?? "-"}</td>
                  <td className="px-4 py-3"><Badge tone={statusTone(item.status)}>{item.status}</Badge></td>
                  <td className="px-4 py-3">{formatCLP(item.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <h2 className="font-semibold">Pagos</h2>
          <p className="mt-2 text-sm text-neutral-600">{order.payments.length} registros manuales.</p>
        </Card>
        <Card>
          <h2 className="font-semibold">Despacho</h2>
          <p className="mt-2 text-sm text-neutral-600">{order.shipments.length} registros manuales.</p>
        </Card>
        <Card>
          <h2 className="font-semibold">Origen</h2>
          <p className="mt-2 text-sm text-neutral-600">{order.lead ? `Lead ${formatDate(order.lead.createdAt)}` : order.source ?? "manual"}</p>
        </Card>
      </div>
    </div>
  );
}
