import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { createManualOrderAction } from "@/features/orders/actions";
import { HELPLIS_PACKS, formatCLP } from "@/lib/marketing/pricing";

export default function NewOrderPage() {
  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Crear pedido manual</h1>
        <p className="mt-1 text-sm text-neutral-600">Sin pago real ni transportista conectado. Se registra operacion manual.</p>
      </header>

      <Card>
        <form action={createManualOrderAction} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre cliente">
              <Input name="customerName" required />
            </Field>
            <Field label="WhatsApp">
              <Input name="phone" required />
            </Field>
            <Field label="Correo">
              <Input name="email" type="email" />
            </Field>
            <Field label="Region">
              <Input name="region" required />
            </Field>
            <Field label="Comuna">
              <Input name="comuna" required />
            </Field>
            <Field label="Pack">
              <Select name="pack" defaultValue="1">
                {HELPLIS_PACKS.map((pack) => (
                  <option key={pack.id} value={pack.id}>
                    {pack.name} · {formatCLP(pack.totalPrice)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Direccion">
              <Input name="address" />
            </Field>
            <Field label="Costo envio manual">
              <Input name="shippingCost" type="number" min={0} defaultValue={0} />
            </Field>
          </div>
          <Field label="Notas direccion">
            <Textarea name="addressNotes" />
          </Field>
          <Field label="Notas internas">
            <Textarea name="notes" />
          </Field>
          <input type="hidden" name="source" value="manual" />
          <Button type="submit">Crear pedido</Button>
        </form>
      </Card>
    </div>
  );
}
