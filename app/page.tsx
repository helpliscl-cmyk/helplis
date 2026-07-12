import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Baby,
  Battery,
  Briefcase,
  Building2,
  CheckCircle2,
  Contact,
  Dog,
  HeartPulse,
  KeyRound,
  MapPin,
  Menu,
  Package,
  QrCode,
  School,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { FunnelTracker } from "@/components/analytics/funnel-tracker";
import { BrandLogo } from "@/components/brand/brand-logo";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OFFICIAL_CONTACT, OFFICIAL_DOMAIN } from "@/lib/constants";
import { HOME_FAQS, HOME_SEO } from "@/lib/marketing/content";
import { HELPLIS_PACKS, formatCLP, getPackHref, getPackSavings, getPackUnitPrice } from "@/lib/marketing/pricing";

export const metadata: Metadata = {
  title: HOME_SEO.title,
  description: HOME_SEO.description,
  alternates: {
    canonical: "https://helplis.cl",
  },
  openGraph: {
    title: HOME_SEO.title,
    description: HOME_SEO.description,
    url: "https://helplis.cl",
    images: [
      {
        url: "/brand/optimized/helplis-og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Pulsera HelPlis con QR y NFC",
      },
    ],
  },
};

const quickBenefits = ["Sin batería", "Sin aplicación obligatoria", "Información actualizable", "Sin mensualidad"];

const problemScenarios: Array<[string, string, LucideIcon]> = [
  ["Un niño se separa", "La persona que lo encuentra necesita saber a quién llamar.", Baby],
  ["Un adulto mayor se desorienta", "Instrucciones simples ayudan a actuar con calma.", UserRound],
  ["Alguien necesita asistencia", "Datos opcionales y contactos autorizados pueden orientar.", HeartPulse],
  ["Una mascota se extravía", "Quien la encuentra puede contactar al responsable.", Dog],
  ["Un objeto queda atrás", "Mochilas, llaves o equipaje tienen una vía de retorno.", Package],
];

const solutionPoints: Array<[string, string, LucideIcon]> = [
  ["QR visible", "Cualquier teléfono con cámara puede abrir la ficha pública.", QrCode],
  ["NFC compatible", "En teléfonos compatibles, basta acercar la pulsera.", Smartphone],
  ["Perfil digital", "La información se actualiza sin cambiar la pulsera.", Contact],
  ["Contacto directo", "Botones de llamada, WhatsApp o aviso según permisos.", Users],
  ["Ubicación voluntaria", "Quien escanea decide si comparte la ubicación de su teléfono.", MapPin],
  ["Sin batería", "No necesita carga, pila ni mantenimiento eléctrico.", Battery],
];

const steps = [
  ["Activas", "Ingresas el código y creas el perfil digital."],
  ["Configuras", "Decides qué datos mostrar y qué contactos usar."],
  ["Alguien escanea", "La ficha permite avisar, llamar o compartir ubicación voluntaria."],
];

const useCases: Array<[string, string, LucideIcon, "primary" | "secondary"]> = [
  ["Niños", "Salidas, colegios, paseos y momentos de alta circulación.", Baby, "primary"],
  ["Adultos mayores", "Apoyo para desorientación, instrucciones simples y contacto familiar.", UserRound, "primary"],
  ["Personas que necesitan asistencia", "Información médica opcional y mensajes de ayuda autorizados.", HeartPulse, "primary"],
  ["Mascotas", "Una vía simple para contactar al tutor.", Dog, "secondary"],
  ["Equipaje", "Datos mínimos para recuperar maletas o mochilas.", Briefcase, "secondary"],
  ["Objetos", "Llaves, bolsos y activos con información actualizable.", Package, "secondary"],
];

const productFeatures = [
  "Pulsera con QR visible",
  "Acceso NFC en teléfonos compatibles",
  "Perfil digital editable",
  "Activación incluida",
  "Sin batería",
  "Sin aplicación obligatoria",
];

const trustSignals: Array<[string, string, LucideIcon]> = [
  ["QR + NFC", "Dos formas de acceso para aumentar compatibilidad.", QrCode],
  ["Sin mensualidad", "Compra única, sin suscripción obligatoria.", CheckCircle2],
  ["Información actualizable", "Puedes cambiar datos sin reemplazar la pulsera.", Contact],
  ["Privacidad configurable", "Tú decides qué se muestra en la ficha pública.", ShieldCheck],
  ["Contacto directo", "Llamada, WhatsApp o aviso según configuración.", Users],
  ["Pensado para Chile", "Comunicación y soporte cercano en esta etapa inicial.", MapPin],
];

const productStructuredData = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Pulsera HelPlis",
  brand: {
    "@type": "Brand",
    name: "HelPlis",
  },
  description: HOME_SEO.description,
  image: "https://helplis.cl/brand/optimized/helplis-og-image.jpg",
  offers: HELPLIS_PACKS.map((pack) => ({
    "@type": "Offer",
    name: pack.name,
    priceCurrency: "CLP",
    price: pack.totalPrice,
    url: `https://helplis.cl${getPackHref(pack.id, "structured_data")}`,
  })),
};

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: HOME_FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

function SectionEyebrow({ children }: { children: string }) {
  return <p className="text-sm font-semibold uppercase text-[var(--brand-accent)]">{children}</p>;
}

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--brand-border)] bg-white/94 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <BrandLogo priority className="h-9 sm:h-10" />
        <nav className="hidden items-center gap-5 text-sm font-medium text-[var(--brand-muted)] xl:flex">
          <a href="#como-funciona" className="hover:text-[var(--brand-primary-dark)]">
            Cómo funciona
          </a>
          <a href="#usos" className="hover:text-[var(--brand-primary-dark)]">
            Para quién sirve
          </a>
          <a href="#pulsera" className="hover:text-[var(--brand-primary-dark)]">
            Pulsera
          </a>
          <a href="#instituciones" className="hover:text-[var(--brand-primary-dark)]">
            Instituciones
          </a>
          <a href="#faq" className="hover:text-[var(--brand-primary-dark)]">
            Preguntas frecuentes
          </a>
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <ButtonLink href="/login" variant="ghost" data-funnel-event="LOGIN_CLICKED">
            Iniciar sesión
          </ButtonLink>
          <ButtonLink href="/activate" variant="secondary" data-funnel-event="ACTIVATION_CLICKED">
            <KeyRound aria-hidden className="h-4 w-4" />
            Activar
          </ButtonLink>
          <ButtonLink href="/quiero-helplis" variant="accent" data-funnel-event="HERO_CTA_CLICKED">
            <ShoppingBag aria-hidden className="h-4 w-4" />
            Comprar HelPlis
          </ButtonLink>
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <ButtonLink href="/quiero-helplis" variant="accent" data-funnel-event="HERO_CTA_CLICKED" className="px-3">
            Comprar
          </ButtonLink>
          <details className="group relative">
            <summary className="inline-flex min-h-11 cursor-pointer list-none items-center justify-center rounded-md border border-[var(--brand-border)] bg-white px-3 text-[var(--brand-text)]">
              <Menu aria-hidden className="h-5 w-5" />
              <span className="sr-only">Abrir menú</span>
            </summary>
            <div className="absolute right-0 top-13 grid w-[min(86vw,320px)] gap-2 rounded-lg border border-[var(--brand-border)] bg-white p-3 text-sm font-medium shadow-lg">
              <a href="#como-funciona" className="rounded-md px-3 py-2 hover:bg-[#edf8fb]">
                Cómo funciona
              </a>
              <a href="#usos" className="rounded-md px-3 py-2 hover:bg-[#edf8fb]">
                Para quién sirve
              </a>
              <a href="#pulsera" className="rounded-md px-3 py-2 hover:bg-[#edf8fb]">
                Pulsera
              </a>
              <a href="#instituciones" className="rounded-md px-3 py-2 hover:bg-[#edf8fb]">
                Instituciones
              </a>
              <a href="#faq" className="rounded-md px-3 py-2 hover:bg-[#edf8fb]">
                Preguntas frecuentes
              </a>
              <div className="mt-2 grid gap-2 border-t border-[var(--brand-border)] pt-3">
                <ButtonLink href="/activate" variant="secondary" data-funnel-event="ACTIVATION_CLICKED">
                  <KeyRound aria-hidden className="h-4 w-4" />
                  Activar
                </ButtonLink>
                <ButtonLink href="/login" variant="ghost" data-funnel-event="LOGIN_CLICKED">
                  Iniciar sesión
                </ButtonLink>
              </div>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

function PricingCard({ pack }: { pack: (typeof HELPLIS_PACKS)[number] }) {
  const savings = getPackSavings(pack);
  const unitPrice = getPackUnitPrice(pack);
  const specificEvent = `PACK_${pack.id}_SELECTED`;

  return (
    <Card
      className={
        pack.id === "2"
          ? "relative border-[var(--brand-primary-light)] p-5 shadow-md"
          : "relative p-5"
      }
    >
      {pack.badge ? (
        <span className="absolute right-4 top-4 rounded-full border border-[#f3d98b] bg-[#fff8e6] px-3 py-1 text-xs font-semibold text-[#725400]">
          {pack.badge}
        </span>
      ) : null}
      <p className="text-sm font-semibold uppercase text-[var(--brand-accent)]">{pack.shortName}</p>
      <h3 className="mt-3 pr-28 text-xl font-semibold">{pack.name}</h3>
      <p className="mt-4 text-4xl font-semibold text-[var(--brand-primary-dark)]">{formatCLP(pack.totalPrice)}</p>
      <div className="mt-4 grid gap-2 text-sm text-[var(--brand-muted)]">
        <p>{formatCLP(unitPrice)} c/u</p>
        <p>Compra única</p>
        <p>Envío se paga aparte</p>
        {savings > 0 ? <p>Ahorro: {formatCLP(savings)} frente a comprar por separado</p> : <p>1 unidad incluida</p>}
      </div>
      <ButtonLink
        href={getPackHref(pack.id)}
        variant="accent"
        className="mt-5 w-full"
        data-funnel-events={`PACK_SELECTED,${specificEvent}`}
        data-funnel-pack={pack.id}
        data-funnel-quantity={pack.quantity}
        data-funnel-price={pack.totalPrice}
        data-funnel-origin="pricing_section"
      >
        <ShoppingBag aria-hidden className="h-4 w-4" />
        {pack.cta}
      </ButtonLink>
    </Card>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--brand-background)] text-[var(--brand-text)]">
      <FunnelTracker pageEvent="HOME_VIEWED" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([productStructuredData, faqStructuredData]) }}
      />
      <Header />

      <section className="relative isolate overflow-hidden border-b border-[var(--brand-border)] bg-white">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/brand/optimized/helplis-bracelet-campaign.webp"
            alt="Pulsera HelPlis con QR, logo y NFC"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/88 to-white/44" />
        </div>
        <div className="mx-auto grid min-h-[76svh] max-w-7xl content-center gap-8 px-4 py-14 lg:py-20">
          <div className="max-w-2xl space-y-7">
            <p className="inline-flex rounded-full border border-[var(--brand-border)] bg-white/88 px-3 py-1 text-sm font-medium text-[var(--brand-primary-dark)]">
              Pulsera inteligente con QR + NFC
            </p>
            <div className="space-y-4">
              <h1 className="text-5xl font-semibold leading-tight tracking-normal text-[var(--brand-text)] sm:text-6xl">
                Si se pierde, ayúdale a volver.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-[var(--brand-muted)]">
                HelPlis permite que quien encuentre a una persona acceda a la información autorizada y contacte rápidamente a su familia.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-lg border border-[var(--brand-border)] bg-white/90 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-[var(--brand-muted)]">Desde</p>
                <p className="text-3xl font-semibold text-[var(--brand-primary-dark)]">$18.000</p>
                <p className="text-sm text-[var(--brand-muted)]">Compra única. Envío aparte.</p>
              </div>
              <ul className="grid gap-2 text-sm font-medium text-[var(--brand-text)] sm:grid-cols-2">
                {quickBenefits.map((item) => (
                  <li key={item} className="flex items-center gap-2 rounded-md bg-white/86 px-3 py-2">
                    <CheckCircle2 aria-hidden className="h-4 w-4 text-[var(--brand-accent)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/quiero-helplis" variant="accent" data-funnel-event="HERO_CTA_CLICKED">
                <ShoppingBag aria-hidden className="h-4 w-4" />
                Comprar HelPlis
              </ButtonLink>
              <ButtonLink href="#como-funciona" variant="secondary">
                <ArrowRight aria-hidden className="h-4 w-4" />
                Ver cómo funciona
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--brand-border)] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <div className="max-w-3xl space-y-3">
            <SectionEyebrow>El problema</SectionEyebrow>
            <h2 className="text-3xl font-semibold sm:text-4xl">Cuando alguien se pierde, cada dato claro ayuda.</h2>
            <p className="text-base leading-7 text-[var(--brand-muted)]">
              HelPlis está pensado para situaciones cotidianas donde identificar, contactar y actuar rápido puede evitar más angustia.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {problemScenarios.map(([title, text, Icon]) => (
              <Card key={title} className="p-5">
                <Icon aria-hidden className="h-6 w-6 text-[var(--brand-accent)]" />
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--brand-muted)]">{text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="brand-gradient border-b border-[var(--brand-border)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="space-y-3">
            <SectionEyebrow>La solución</SectionEyebrow>
            <h2 className="text-3xl font-semibold sm:text-4xl">Una pulsera que abre una ficha de ayuda en segundos.</h2>
            <p className="text-base leading-7 text-[var(--brand-muted)]">
              Quien escanea ve solo la información autorizada: contactos, instrucciones y acciones simples para avisar.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {solutionPoints.map(([title, text, Icon]) => (
              <div key={title} className="rounded-lg border border-[var(--brand-border)] bg-white p-4">
                <Icon aria-hidden className="h-5 w-5 text-[var(--brand-accent)]" />
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-[var(--brand-muted)]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" data-funnel-view="HOW_IT_WORKS_VIEWED" className="border-b border-[var(--brand-border)] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
            <div className="space-y-3">
              <SectionEyebrow>Cómo funciona</SectionEyebrow>
              <h2 className="text-3xl font-semibold sm:text-4xl">Tres pasos para quedar listo.</h2>
              <p className="text-base leading-7 text-[var(--brand-muted)]">
                Sin app obligatoria, sin batería y sin rastreo permanente.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {steps.map(([title, text], index) => (
                <div key={title} className="rounded-lg border border-[var(--brand-border)] bg-[#f8fbfe] p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#e6fbf9] text-sm font-semibold text-[var(--brand-primary-dark)]">
                    {index + 1}
                  </div>
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--brand-muted)]">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="usos" className="border-b border-[var(--brand-border)] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <div className="max-w-3xl space-y-3">
            <SectionEyebrow>Para quién sirve</SectionEyebrow>
            <h2 className="text-3xl font-semibold sm:text-4xl">Personas primero. También mascotas, equipaje y objetos.</h2>
            <p className="text-base leading-7 text-[var(--brand-muted)]">
              El foco inicial está en niños, adultos mayores y personas que necesitan asistencia, sin cerrar otros usos prácticos.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {useCases.map(([title, text, Icon, priority]) => (
              <Card key={title} className={priority === "primary" ? "border-[var(--brand-primary-light)] p-5" : "p-5"}>
                <Icon aria-hidden className="h-6 w-6 text-[var(--brand-accent)]" />
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--brand-muted)]">{text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="pulsera" data-funnel-view="PRODUCT_VIEWED" className="border-b border-[var(--brand-border)] bg-[#071b3a] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="relative min-h-[360px] overflow-hidden rounded-lg bg-white/8">
            <Image
              src="/brand/optimized/helplis-bracelet-campaign.webp"
              alt="Pulsera HelPlis con QR y NFC"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover object-center"
            />
          </div>
          <div className="space-y-5">
            <SectionEyebrow>Pulsera HelPlis</SectionEyebrow>
            <h2 className="text-3xl font-semibold sm:text-4xl">Pequeña pulsera. Gran ayuda.</h2>
            <p className="text-base leading-7 text-blue-50">
              Cada pulsera incluye acceso a su perfil digital y activación. La información puede actualizarse posteriormente sin cambiar la pulsera.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {productFeatures.map((item) => (
                <div key={item} className="flex items-start gap-2 rounded-lg border border-white/16 bg-white/8 p-3 text-sm text-blue-50">
                  <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 text-[var(--brand-primary-light)]" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="precios" data-funnel-view="PRICING_VIEWED" className="border-b border-[var(--brand-border)] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div className="space-y-3">
              <SectionEyebrow>Precios</SectionEyebrow>
              <h2 className="text-3xl font-semibold sm:text-4xl">Elige tu HelPlis</h2>
              <p className="text-base leading-7 text-[var(--brand-muted)]">
                Compra única, sin mensualidad obligatoria. El envío se cotiza o informa por separado.
              </p>
            </div>
            <div className="rounded-lg border border-[var(--brand-border)] bg-[#f8fbfe] p-4 text-sm leading-6 text-[var(--brand-muted)]">
              No se suma envío en la web. Te contactaremos para confirmar datos, resolver dudas y coordinar el costo de envío según destino.
            </div>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {HELPLIS_PACKS.map((pack) => (
              <PricingCard key={pack.id} pack={pack} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--brand-border)] bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-3">
            <SectionEyebrow>Tecnología simple, ayuda real</SectionEyebrow>
            <h2 className="text-3xl font-semibold sm:text-4xl">Diseñada para que ayudar sea fácil.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {trustSignals.map(([title, text, Icon]) => (
              <Card key={title} className="p-5">
                <Icon aria-hidden className="h-6 w-6 text-[var(--brand-accent)]" />
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--brand-muted)]">{text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--brand-border)] bg-[var(--brand-primary-dark)] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="space-y-4">
            <ShieldCheck aria-hidden className="h-8 w-8 text-[var(--brand-primary-light)]" />
            <h2 className="text-3xl font-semibold sm:text-4xl">Privacidad para ayudar, no para vigilar.</h2>
            <p className="text-base leading-7 text-blue-50">
              La pulsera no contiene GPS y no rastrea permanentemente. Si alguien escanea, puede compartir la ubicación de su propio teléfono solo si acepta.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Tú decides qué información mostrar.",
              "El domicilio no debe mostrarse de forma predeterminada.",
              "Los datos se pueden actualizar.",
              "La ubicación no se comparte automáticamente.",
            ].map((item) => (
              <div key={item} className="rounded-lg border border-white/18 bg-white/8 p-4 text-sm leading-6 text-blue-50">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="instituciones" className="border-b border-[var(--brand-border)] bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-4">
            <Building2 aria-hidden className="h-8 w-8 text-[var(--brand-accent)]" />
            <SectionEyebrow>Instituciones</SectionEyebrow>
            <h2 className="text-3xl font-semibold sm:text-4xl">Condiciones especiales según cantidad.</h2>
            <p className="text-base leading-7 text-[var(--brand-muted)]">
              Para colegios, jardines, academias y organizaciones podemos preparar condiciones especiales según cantidad.
            </p>
            <div className="grid gap-2 text-sm leading-6 text-[var(--brand-muted)]">
              {[
                "No publicamos descuentos institucionales sin una cotización.",
                "Podemos acompañar la activación y resolver dudas de la comunidad.",
                "Los precios retail no reemplazan una propuesta institucional.",
              ].map((item) => (
                <p key={item} className="flex items-start gap-2">
                  <CheckCircle2 aria-hidden className="mt-1 h-4 w-4 text-[var(--brand-accent)]" />
                  <span>{item}</span>
                </p>
              ))}
            </div>
            <ButtonLink href="/quiero-helplis?source=institution_cta" variant="accent" data-funnel-event="INSTITUTION_CTA_CLICKED">
              <School aria-hidden className="h-4 w-4" />
              Solicitar cotización institucional
            </ButtonLink>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {["Colegios", "Jardines", "Academias", "Fundaciones", "Municipalidades", "Empresas"].map((item) => (
              <div key={item} className="rounded-lg border border-[var(--brand-border)] bg-[#f8fbfe] p-4 text-sm font-medium">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="border-b border-[var(--brand-border)] brand-gradient">
        <div className="mx-auto max-w-4xl px-4 py-14">
          <SectionEyebrow>Preguntas frecuentes</SectionEyebrow>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Dudas antes de comprar tu HelPlis</h2>
          <div className="mt-8 grid gap-4">
            {HOME_FAQS.map((faq) => (
              <Card key={faq.question} className="p-5">
                <h3 className="font-semibold">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--brand-muted)]">{faq.answer}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase text-[var(--brand-accent)]">Compra única desde $18.000</p>
            <h2 className="mt-2 text-3xl font-semibold">Una pequeña pulsera puede hacer más fácil el reencuentro.</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--brand-muted)]">
              Sin mensualidad obligatoria, con activación incluida y envío aparte.
            </p>
            <p className="mt-3 text-sm text-[var(--brand-muted)]">
              ¿Ya tienes una?{" "}
              <Link
                href="/activate"
                data-funnel-event="ACTIVATION_CLICKED"
                className="font-medium text-[var(--brand-primary-dark)] underline"
              >
                Activar pulsera
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/quiero-helplis" variant="accent" data-funnel-event="HERO_CTA_CLICKED">
              <ShoppingBag aria-hidden className="h-4 w-4" />
              Comprar HelPlis
            </ButtonLink>
            <ButtonLink href="/quiero-helplis?source=institution_cta" variant="secondary" data-funnel-event="INSTITUTION_CTA_CLICKED">
              <Building2 aria-hidden className="h-4 w-4" />
              Solicitar alianza
            </ButtonLink>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--brand-border)] bg-[#071b3a] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:grid-cols-[1fr_auto]">
          <div className="space-y-3">
            <BrandLogo className="h-9 rounded bg-white px-2 py-1" />
            <p className="max-w-xl text-sm leading-6 text-blue-50">
              HelPlis conecta, informa y ayuda al reencuentro sin prometer rastreo permanente ni vigilancia.
            </p>
          </div>
          <div className="grid gap-2 text-sm text-blue-50">
            <p>{OFFICIAL_CONTACT.name}</p>
            <p>{OFFICIAL_CONTACT.email}</p>
            <a
              href={`https://wa.me/${OFFICIAL_CONTACT.phoneE164.replace("+", "")}`}
              data-funnel-event="WHATSAPP_CLICKED"
              className="underline"
            >
              {OFFICIAL_CONTACT.phoneDisplay}
            </a>
            <p>{OFFICIAL_DOMAIN.replace("https://", "")}</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
