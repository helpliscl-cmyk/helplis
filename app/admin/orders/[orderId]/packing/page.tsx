import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckboxField } from "@/components/ui/field";
import { completePackingAction } from "@/features/orders/fulfillment-actions";
import { formatCLP } from "@/lib/marketing/pricing";
import { revealPackingActivationCodes } from "@/server/operations/fulfillment";

export default async function PackingPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const user = await getCurrentUser();
  const { order, rows } = await revealPackingActivationCodes(orderId, user?.id);

  return (
    <div className="grid gap-5">
      <header>
        <Link className="text-sm text-[var(--brand-primary-dark)] underline-offset-4 hover:underline" href={`/admin/orders/${order.id}`}>
          Volver al pedido
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Packing {order.orderNumber}</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {order.customerName} · pack {order.pack} · {formatCLP(order.total)}
        </p>
      </header>

      <Card className="border-amber-200 bg-amber-50">
        <p className="text-sm font-medium text-amber-900">
          Cada visualizacion de activationCode queda auditada. No compartas codigos fuera de la tarjeta del pedido.
        </p>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-neutral-100 p-4">
          <h2 className="text-lg font-semibold">Unidades reservadas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[920px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Public code</th>
                <th className="px-4 py-3">Activation code</th>
                <th className="px-4 py-3">Lote</th>
                <th className="px-4 py-3">Verificacion</th>
                <th className="px-4 py-3">URL</th>
                <th className="px-4 py-3">Tarjeta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rows.map((row) => (
                <tr key={row.itemId}>
                  <td className="px-4 py-3 font-medium">{row.publicCode ?? "Sin asignar"}</td>
                  <td className="px-4 py-3 font-mono text-base">{row.activationCode ?? "No disponible"}</td>
                  <td className="px-4 py-3">{row.batchReference ?? "-"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(row.verificationStatus ?? "PENDING")}>{row.verificationStatus ?? "PENDING"}</Badge>
                  </td>
                  <td className="px-4 py-3">{row.publicUrl ?? "-"}</td>
                  <td className="px-4 py-3">
                    <Link className="text-[var(--brand-primary-dark)] underline-offset-4 hover:underline" href={`/admin/orders/${order.id}/activation-card`}>
                      Imprimir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Checklist</h2>
        <form action={completePackingAction} className="grid gap-3">
          <input type="hidden" name="orderId" value={order.id} />
          <CheckboxField name="quantityCorrect" label="Cantidad correcta." />
          <CheckboxField name="verifiedDevices" label="Pulseras verificadas." />
          <CheckboxField name="qrChecked" label="QR correcto." />
          <CheckboxField name="nfcChecked" label="NFC correcto." />
          <CheckboxField name="activationCodesChecked" label="ActivationCode correcto." />
          <CheckboxField name="cardsIncluded" label="Tarjeta incluida." />
          <CheckboxField name="packageClosed" label="Empaque cerrado." />
          <CheckboxField name="addressConfirmed" label="Direccion confirmada." />
          <CheckboxField name="paymentConfirmed" label="Pago confirmado." />
          <Button type="submit">Marcar listo para despacho</Button>
        </form>
      </Card>
    </div>
  );
}
