import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, CheckCircle2, MessageCircle, ShoppingBag } from "lucide-react";
import { FunnelTracker } from "@/components/analytics/funnel-tracker";
import { BrandLogo } from "@/components/brand/brand-logo";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OFFICIAL_CONTACT } from "@/lib/constants";
import { HOME_SEO } from "@/lib/marketing/content";
import { buildWhatsAppOrderUrl, formatCLP, getHelplisPack } from "@/lib/marketing/pricing";
import { prisma } from "@/server/db/client";
import { PurchaseIntentForm } from "./purchase-intent-form";

export const metadata: Metadata = {
  title: "Comprar HelPlis",
  description: `${HOME_SEO.description} Elige pack y deja tus datos para coordinar tu solicitud.`,
};

export default async function PurchaseIntentPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string; source?: string; tipo?: string; pack?: string; intent?: string }>;
}) {
  const params = await searchParams;
  const selectedPack = getHelplisPack(params.pack);
  const source = params.source ?? (params.tipo === "institucion" ? "institution_cta" : "order_form");
  const intent = params.sent && params.intent
    ? await prisma.purchaseIntent.findUnique({
        where: { id: params.intent },
        select: {
          id: true,
          name: true,
          commune: true,
          region: true,
          packId: true,
          quantity: true,
          totalPrice: true,
          primaryUse: true,
          createdAt: true,
        },
      })
    : null;
  const confirmationPack = intent ? getHelplisPack(intent.packId) : selectedPack;
  const eventMetadata = {
    pack: confirmationPack.id,
    quantity: confirmationPack.quantity,
    price: confirmationPack.totalPrice,
    origin: source,
  };

  return (
    <main className="brand-gradient min-h-screen px-4 py-8">
      <FunnelTracker
        pageEvents={[
          {
            eventName: params.sent ? "PURCHASE_INTENT_COMPLETED" : "PURCHASE_INTENT_STARTED",
            metadata: eventMetadata,
          },
          {
            eventName: params.sent ? "ORDER_INTENT_COMPLETED" : "ORDER_INTENT_STARTED",
            metadata: eventMetadata,
          },
        ]}
      />
      <div className="mx-auto grid max-w-6xl gap-6">
        <div className="flex items-center justify-between gap-4">
          <BrandLogo className="h-10" />
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--brand-muted)] underline">
            <ArrowLeft aria-hidden className="h-4 w-4" />
            Volver
          </Link>
        </div>

        {params.sent ? (
          <Card className="mx-auto max-w-3xl p-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 aria-hidden className="mt-1 h-6 w-6 text-[var(--brand-accent)]" />
              <div>
                <p className="text-sm font-semibold uppercase text-[var(--brand-accent)]">Solicitud registrada</p>
                <h1 className="mt-2 text-3xl font-semibold">Te contactaremos para coordinar tu HelPlis.</h1>
                <p className="mt-3 text-sm leading-6 text-[var(--brand-muted)]">
                  No se ha realizado un pago. Esta solicitud queda como intención de compra y el envío se cotiza o informa por separado.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 rounded-lg border border-[var(--brand-border)] bg-[#f8fbfe] p-4 text-sm sm:grid-cols-2">
              <p>
                <span className="font-semibold">Pack:</span> {confirmationPack.name}
              </p>
              <p>
                <span className="font-semibold">Cantidad:</span> {confirmationPack.quantity}
              </p>
              <p>
                <span className="font-semibold">Precio:</span> {formatCLP(confirmationPack.totalPrice)}
              </p>
              <p>
                <span className="font-semibold">Envío:</span> pendiente por separado
              </p>
              {intent ? (
                <>
                  <p>
                    <span className="font-semibold">Comuna:</span> {intent.commune}
                  </p>
                  <p>
                    <span className="font-semibold">Región:</span> {intent.region}
                  </p>
                </>
              ) : null}
            </div>

            {intent ? (
              <ButtonLink
                href={buildWhatsAppOrderUrl({
                  name: intent.name,
                  commune: intent.commune,
                  pack: confirmationPack,
                  phoneE164: OFFICIAL_CONTACT.phoneE164,
                })}
                target="_blank"
                rel="noreferrer"
                variant="accent"
                className="mt-6 w-full sm:w-auto"
                data-funnel-event="WHATSAPP_ORDER_CLICKED"
                data-funnel-pack={confirmationPack.id}
                data-funnel-quantity={confirmationPack.quantity}
                data-funnel-price={confirmationPack.totalPrice}
                data-funnel-origin="order_confirmation"
              >
                <MessageCircle aria-hidden className="h-4 w-4" />
                Abrir WhatsApp
              </ButtonLink>
            ) : null}
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <section className="grid gap-5">
              <div className="space-y-4">
                <p className="inline-flex rounded-full border border-[var(--brand-border)] bg-white px-3 py-1 text-sm font-medium text-[var(--brand-primary-dark)]">
                  Compra única desde $18.000
                </p>
                <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">Comprar HelPlis</h1>
                <p className="max-w-xl text-base leading-7 text-[var(--brand-muted)]">
                  Elige tu pack, deja tus datos y te contactaremos para coordinar la compra.
                </p>
              </div>

              <div className="grid gap-3">
                {[
                  "No necesitas crear una cuenta para solicitar tu HelPlis.",
                  "Cada pulsera incluye activación y acceso a su perfil digital.",
                  "La información puede actualizarse sin cambiar la pulsera.",
                  "No hay mensualidad obligatoria ni suscripción de compra.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-lg border border-[var(--brand-border)] bg-white p-4 text-sm leading-6">
                    <CheckCircle2 aria-hidden className="mt-0.5 h-5 w-5 text-[var(--brand-accent)]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <Card className="p-5">
                <h2 className="text-lg font-semibold">¿Ya tienes una pulsera?</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--brand-muted)]">
                  La activación queda como acceso secundario para clientes que ya recibieron su HelPlis.
                </p>
                <ButtonLink href="/activate" variant="secondary" className="mt-4">
                  Activar pulsera
                </ButtonLink>
              </Card>
            </section>

            <PurchaseIntentForm
              initialPackId={selectedPack.id}
              source={source}
              defaultPrimaryUse={source === "institution_cta" ? "institución" : undefined}
              error={params.error}
            />
          </div>
        )}

        <div className="flex justify-center text-sm text-[var(--brand-muted)]">
          <Link href="/" className="inline-flex items-center gap-2 underline">
            <ShoppingBag aria-hidden className="h-4 w-4" />
            Volver al home comercial
          </Link>
        </div>
      </div>
    </main>
  );
}
