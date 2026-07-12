import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, CheckCircle2, ShoppingBag } from "lucide-react";
import { FunnelTracker } from "@/components/analytics/funnel-tracker";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckboxField, Field, Input, Select, Textarea } from "@/components/ui/field";
import { createPurchaseIntentAction } from "@/features/marketing/actions";

export const metadata: Metadata = {
  title: "Quiero mi HelPlis",
  description: "Deja tu interes para recibir novedades de disponibilidad, preventa y alianzas HelPlis.",
};

const useOptions = [
  "Ninos",
  "Adultos mayores",
  "Persona que necesita asistencia",
  "Mascotas",
  "Equipaje",
  "Objetos",
  "Institucion o comunidad",
];

export default async function PurchaseIntentPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string; tipo?: string }>;
}) {
  const params = await searchParams;
  const defaultUse = params.tipo === "institucion" ? "Institucion o comunidad" : "Ninos";

  return (
    <main className="brand-gradient min-h-screen px-4 py-8">
      <FunnelTracker pageEvent={params.sent ? "PURCHASE_INTENT_COMPLETED" : "PURCHASE_INTENT_STARTED"} />
      <div className="mx-auto grid max-w-6xl gap-6">
        <div className="flex items-center justify-between gap-4">
          <BrandLogo className="h-10" />
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--brand-muted)] underline">
            <ArrowLeft aria-hidden className="h-4 w-4" />
            Volver
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <section className="grid gap-5">
            <div className="space-y-4">
              <p className="inline-flex rounded-full border border-[var(--brand-border)] bg-white px-3 py-1 text-sm font-medium text-[var(--brand-primary-dark)]">
                Interes y preventa
              </p>
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">Quiero mi HelPlis</h1>
              <p className="max-w-xl text-base leading-7 text-[var(--brand-muted)]">
                Dejanos tus datos y te contactaremos cuando abramos disponibilidad, preventa o alternativas para instituciones.
              </p>
            </div>

            <div className="grid gap-3">
              {[
                "No necesitas crear cuenta para dejar tu interes.",
                "No hay precio final publicado todavia.",
                "Te contactaremos por WhatsApp, telefono o correo si lo autorizas.",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-lg border border-[var(--brand-border)] bg-white p-4 text-sm leading-6">
                  <CheckCircle2 aria-hidden className="mt-0.5 h-5 w-5 text-[var(--brand-accent)]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          <Card className="p-5">
            <h2 className="text-xl font-semibold">Datos de contacto</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--brand-muted)]">
              Maximo lo necesario para entender tu interes y responderte bien.
            </p>

            {params.sent ? (
              <p className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                Interes registrado. Te contactaremos cuando tengamos novedades.
              </p>
            ) : null}
            {params.error ? (
              <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                Revisa los datos del formulario y acepta el contacto.
              </p>
            ) : null}

            <form action={createPurchaseIntentAction} className="mt-5 grid gap-4">
              <input type="hidden" name="source" value={params.tipo === "institucion" ? "institution_cta" : "home_cta"} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre">
                  <Input name="name" autoComplete="name" required />
                </Field>
                <Field label="Telefono o WhatsApp">
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
                <Field label="Cantidad estimada">
                  <Input name="quantity" type="number" min={1} max={200} defaultValue={1} required />
                </Field>
                <Field label="Uso principal">
                  <Select name="primaryUse" defaultValue={defaultUse} required>
                    {useOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="Mensaje opcional">
                <Textarea name="message" placeholder="Ej: busco para mi hijo, para mi papá, para un colegio..." />
              </Field>
              <CheckboxField
                name="contactAccepted"
                label="Acepto que HelPlis me contacte por WhatsApp, telefono o correo para responder mi solicitud."
              />
              <Button type="submit">
                <ShoppingBag aria-hidden className="h-4 w-4" />
                Registrar interes
              </Button>
            </form>

            <div className="mt-5 border-t border-[var(--brand-border)] pt-4 text-sm text-[var(--brand-muted)]">
              ¿Ya tienes una pulsera?{" "}
              <ButtonLink href="/activate" variant="secondary" className="mt-2 w-full sm:w-auto">
                Activar pulsera
              </ButtonLink>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
