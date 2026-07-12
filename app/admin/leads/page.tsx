import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { convertLeadToOrderAction } from "@/features/orders/actions";
import { formatDate } from "@/lib/formatting/format";
import { PURCHASE_INTENT_STATUSES } from "@/lib/marketing/content";
import { formatCLP, getHelplisPack } from "@/lib/marketing/pricing";
import { prisma } from "@/server/db/client";

export default async function AdminLeadsPage() {
  const leads = await prisma.purchaseIntent.findMany({
    include: { order: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Leads comerciales</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Solicitudes e intenciones de compra. No son ventas confirmadas ni checkout automático.
        </p>
      </header>

      <Card>
        <h2 className="font-semibold">Estados sugeridos</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {PURCHASE_INTENT_STATUSES.map((status) => (
            <Badge key={status} tone={statusTone(status)}>
              {status}
            </Badge>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-[1180px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">WhatsApp</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Comuna</th>
                <th className="px-4 py-3">Región</th>
                <th className="px-4 py-3">Pack</th>
                <th className="px-4 py-3">Cantidad</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Envío</th>
                <th className="px-4 py-3">Uso</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Origen</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Pedido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {leads.map((lead) => {
                const pack = getHelplisPack(lead.packId);
                return (
                  <tr key={lead.id} className="align-top">
                    <td className="px-4 py-3 font-medium">{lead.name}</td>
                    <td className="px-4 py-3">{lead.phone}</td>
                    <td className="px-4 py-3">{lead.email ?? "Sin correo"}</td>
                    <td className="px-4 py-3">{lead.commune}</td>
                    <td className="px-4 py-3">{lead.region || "Sin región"}</td>
                    <td className="px-4 py-3">{pack.name}</td>
                    <td className="px-4 py-3">{lead.quantity}</td>
                    <td className="px-4 py-3">{formatCLP(lead.totalPrice)}</td>
                    <td className="px-4 py-3">{lead.shippingPending ? "Pendiente" : "Resuelto"}</td>
                    <td className="px-4 py-3">{lead.primaryUse}</td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(lead.status)}>{lead.status}</Badge>
                    </td>
                    <td className="px-4 py-3">{lead.origin ?? lead.source ?? "Sin origen"}</td>
                    <td className="px-4 py-3">{formatDate(lead.createdAt)}</td>
                    <td className="px-4 py-3">
                      {lead.order ? (
                        <a className="text-[var(--brand-primary-dark)] underline-offset-4 hover:underline" href={`/admin/orders/${lead.order.id}`}>
                          {lead.order.orderNumber}
                        </a>
                      ) : (
                        <form action={convertLeadToOrderAction}>
                          <input type="hidden" name="leadId" value={lead.id} />
                          <Button type="submit" variant="secondary" className="min-h-9 px-3 py-1">
                            Convertir
                          </Button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!leads.length ? <p className="p-4 text-sm text-neutral-600">No hay leads comerciales todavía.</p> : null}
      </Card>
    </div>
  );
}
