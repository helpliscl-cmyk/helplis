"use client";

import { useState } from "react";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckboxField, Field, Input, Select, Textarea } from "@/components/ui/field";
import { PRIMARY_USE_OPTIONS } from "@/lib/marketing/content";
import {
  HELPLIS_PACKS,
  type PackId,
  formatCLP,
  getHelplisPack,
  getPackSavings,
  getPackUnitPrice,
} from "@/lib/marketing/pricing";
import { createPurchaseIntentAction } from "@/features/marketing/actions";

export function PurchaseIntentForm({
  initialPackId,
  source,
  defaultPrimaryUse,
  error,
}: {
  initialPackId: PackId;
  source: string;
  defaultPrimaryUse?: string;
  error?: string;
}) {
  const [packId, setPackId] = useState<PackId>(initialPackId);
  const selectedPack = getHelplisPack(packId);
  const unitPrice = getPackUnitPrice(selectedPack);
  const savings = getPackSavings(selectedPack);

  return (
    <Card className="p-5">
      <h2 className="text-xl font-semibold">Datos del comprador</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--brand-muted)]">
        Solicitamos lo mínimo para responderte y confirmar el pack elegido.
      </p>

      {error ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Revisa los datos del formulario, el pack elegido y la aceptación de contacto.
        </p>
      ) : null}

      <form action={createPurchaseIntentAction} className="mt-5 grid gap-5">
        <input type="hidden" name="source" value={source} />
        <input type="hidden" name="origin" value={source} />
        <input type="hidden" name="expectedTotalPrice" value={selectedPack.totalPrice} />

        <fieldset className="grid gap-3">
          <legend className="text-sm font-semibold text-[var(--brand-text)]">Elige tu pack</legend>
          <div className="grid gap-3 lg:grid-cols-3">
            {HELPLIS_PACKS.map((pack) => {
              const isSelected = pack.id === packId;
              const specificEvent = `PACK_${pack.id}_SELECTED`;
              return (
                <label
                  key={pack.id}
                  className={[
                    "grid cursor-pointer gap-2 rounded-lg border p-4 text-sm transition",
                    isSelected
                      ? "border-[var(--brand-primary-light)] bg-[#eafffb] shadow-sm"
                      : "border-[var(--brand-border)] bg-white hover:bg-[#f8fbfe]",
                  ].join(" ")}
                  data-funnel-events={`PACK_SELECTED,${specificEvent}`}
                  data-funnel-pack={pack.id}
                  data-funnel-quantity={pack.quantity}
                  data-funnel-price={pack.totalPrice}
                  data-funnel-origin="order_form"
                >
                  <input
                    type="radio"
                    name="pack"
                    value={pack.id}
                    checked={isSelected}
                    onChange={() => setPackId(pack.id)}
                    className="sr-only"
                  />
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{pack.shortName}</span>
                    {isSelected ? <CheckCircle2 aria-hidden className="h-4 w-4 text-[var(--brand-accent)]" /> : null}
                  </span>
                  <span>{pack.name}</span>
                  <span className="text-xl font-semibold text-[var(--brand-primary-dark)]">{formatCLP(pack.totalPrice)}</span>
                  <span className="text-xs text-[var(--brand-muted)]">{formatCLP(getPackUnitPrice(pack))} c/u</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre">
            <Input name="name" autoComplete="name" required />
          </Field>
          <Field label="WhatsApp">
            <Input name="phone" type="tel" autoComplete="tel" required />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Correo opcional">
            <Input name="email" type="email" autoComplete="email" />
          </Field>
          <Field label="Comuna">
            <Input name="commune" autoComplete="address-level2" required />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Región">
            <Input name="region" autoComplete="address-level1" required />
          </Field>
          <Field label="Uso principal">
            <Select name="primaryUse" defaultValue={defaultPrimaryUse ?? PRIMARY_USE_OPTIONS[0].value} required>
              {PRIMARY_USE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Observaciones opcionales">
          <Textarea name="message" placeholder="Ej: busco una pulsera para mi hijo, para mi papá o para una institución." />
        </Field>
        <div className="rounded-lg border border-[var(--brand-border)] bg-[#f8fbfe] p-4">
          <h3 className="font-semibold">Resumen final</h3>
          <div className="mt-3 grid gap-2 text-sm text-[var(--brand-muted)] sm:grid-cols-2">
            <p>
              <span className="font-medium text-[var(--brand-text)]">Pack:</span> {selectedPack.name}
            </p>
            <p>
              <span className="font-medium text-[var(--brand-text)]">Cantidad:</span> {selectedPack.quantity}
            </p>
            <p>
              <span className="font-medium text-[var(--brand-text)]">Total:</span> {formatCLP(selectedPack.totalPrice)}
            </p>
            <p>
              <span className="font-medium text-[var(--brand-text)]">Unidad:</span> {formatCLP(unitPrice)} c/u
            </p>
            <p>
              <span className="font-medium text-[var(--brand-text)]">Compra:</span> única
            </p>
            <p>
              <span className="font-medium text-[var(--brand-text)]">Envío:</span> se informa por separado
            </p>
          </div>
          {savings > 0 ? (
            <p className="mt-3 text-sm font-medium text-[var(--brand-primary-dark)]">
              Ahorro frente a comprar por separado: {formatCLP(savings)}.
            </p>
          ) : null}
        </div>
        <CheckboxField
          name="contactAccepted"
          label="Acepto que HelPlis me contacte por WhatsApp, teléfono o correo para responder mi solicitud."
        />
        <Button type="submit">
          <ShoppingBag aria-hidden className="h-4 w-4" />
          Enviar solicitud de compra
        </Button>
      </form>
    </Card>
  );
}
