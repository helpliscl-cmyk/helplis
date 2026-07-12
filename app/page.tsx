import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Baby,
  Battery,
  Building2,
  CheckCircle2,
  Contact,
  Dog,
  HeartPulse,
  KeyRound,
  MapPin,
  Menu,
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

const helpPoints: Array<[string, string, LucideIcon]> = [
  ["Niños", "Contacto rápido si se separan en salidas, plazas o colegios.", Baby],
  ["Adultos mayores", "Instrucciones simples cuando alguien se desorienta.", UserRound],
  ["Personas que necesitan asistencia", "Datos autorizados para apoyar una respuesta clara.", HeartPulse],
  ["Mascotas y objetos", "Una vía de contacto para recuperar lo importante.", Dog],
];

const steps = [
  ["Activas", "Ingresas el código y creas el perfil digital."],
  ["Configuras", "Decides qué datos mostrar y qué contactos usar."],
  ["Escanean", "La ficha permite llamar, escribir o compartir ubicación voluntaria."],
];

const productFeatures: Array<[string, string, LucideIcon]> = [
  ["QR visible", "Funciona con la cámara del teléfono.", QrCode],
  ["NFC compatible", "Permite acercar el teléfono a la pulsera.", Smartphone],
  ["Sin batería", "No requiere carga ni pila.", Battery],
  ["Perfil editable", "Puedes actualizar datos sin cambiar la pulsera.", Contact],
];

const confidencePoints: Array<[string, string, LucideIcon]> = [
  ["Sin GPS", "No realiza rastreo permanente.", ShieldCheck],
  ["Ubicación voluntaria", "Quien escanea decide si la comparte.", MapPin],
  ["Datos configurables", "Tú eliges qué información mostrar.", CheckCircle2],
  ["Contacto directo", "Llamada, WhatsApp o aviso según permisos.", Users],
];

const visibleFaqs = HOME_FAQS.slice(0, 7);

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
          <a href="#precios" className="hover:text-[var(--brand-primary-dark)]">
            Precios
          </a>
          <a href="#privacidad" className="hover:text-[var(--brand-primary-dark)]">
            Privacidad
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
              <a href="#precios" className="rounded-md px-3 py-2 hover:bg-[#edf8fb]">
                Precios
              </a>
              <a href="#privacidad" className="rounded-md px-3 py-2 hover:bg-[#edf8fb]">
                Privacidad
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
    <Card className={pack.id === "2" ? "relative border-[var(--brand-primary-light)] p-5 shadow-md" : "relative p-5"}>
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
        <div className="mx-auto grid min-h-[72svh] max-w-7xl content-center gap-8 px-4 py-12 lg:py-16">
          <div className="max-w-2xl space-y-6">
            <p className="inline-flex rounded-full border border-[var(--brand-border)] bg-white/88 px-3 py-1 text-sm font-medium text-[var(--brand-primary-dark)]">
              Pulsera inteligente con QR + NFC
            </p>
            <div className="space-y-4">
              <h1 className="text-5xl font-semibold leading-tight tracking-normal text-[var(--brand-text)] sm:text-6xl">
                Si se pierde, ayúdale a volver.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-[var(--brand-muted)]">
                HelPlis abre una ficha autorizada para que quien encuentre a una persona, mascota u objeto pueda contactar rápido.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-lg border border-[var(--brand-border)] bg-white/90 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-[var(--brand-muted)]">Desde</p>
                <p className="text-3xl font-semibold text-[var(--brand-primary-dark)]">$18.000</p>
                <p className="text-sm text-[var(--brand-muted)]">Compra única.</p>
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

      <section id="como-funciona" data-funnel-view="HOW_IT_WORKS_VIEWED" className="border-b border-[var(--brand-border)] bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="space-y-3">
            <SectionEyebrow>Cómo ayuda</SectionEyebrow>
            <h2 className="text-3xl font-semibold sm:text-4xl">Información útil en segundos.</h2>
            <p className="text-base leading-7 text-[var(--brand-muted)]">
              QR y NFC llevan a una ficha pública configurable: contactos, instrucciones y acciones simples para avisar.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {helpPoints.map(([title, text, Icon]) => (
              <Card key={title} className="p-5">
                <Icon aria-hidden className="h-6 w-6 text-[var(--brand-accent)]" />
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--brand-muted)]">{text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="pulsera" data-funnel-view="PRODUCT_VIEWED" className="border-b border-[var(--brand-border)] bg-[#071b3a] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="relative min-h-[320px] overflow-hidden rounded-lg bg-white/8">
            <Image
              src="/brand/optimized/helplis-bracelet-campaign.webp"
              alt="Pulsera HelPlis con QR y NFC"
              fill
              sizes="(min-width: 1024px) 48vw, 100vw"
              className="object-cover object-center"
            />
          </div>
          <div className="space-y-6">
            <div className="space-y-3">
              <SectionEyebrow>Pulsera HelPlis</SectionEyebrow>
              <h2 className="text-3xl font-semibold sm:text-4xl">Activas, configuras y queda lista.</h2>
              <p className="text-base leading-7 text-blue-50">
                Cada pulsera incluye activación y acceso a un perfil digital que puedes actualizar después.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {productFeatures.map(([title, text, Icon]) => (
                <div key={title} className="rounded-lg border border-white/16 bg-white/8 p-4 text-blue-50">
                  <Icon aria-hidden className="h-5 w-5 text-[var(--brand-primary-light)]" />
                  <h3 className="mt-3 font-semibold text-white">{title}</h3>
                  <p className="mt-1 text-sm leading-6">{text}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {steps.map(([title, text], index) => (
                <div key={title} className="rounded-lg border border-white/16 bg-white/8 p-4 text-sm text-blue-50">
                  <div className="font-semibold text-white">{index + 1}. {title}</div>
                  <p className="mt-1 leading-6">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="precios" data-funnel-view="PRICING_VIEWED" className="border-b border-[var(--brand-border)] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="max-w-3xl space-y-3">
            <SectionEyebrow>Precios</SectionEyebrow>
            <h2 className="text-3xl font-semibold sm:text-4xl">Elige tu HelPlis</h2>
            <p className="text-base leading-7 text-[var(--brand-muted)]">Compra única, sin mensualidad obligatoria.</p>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {HELPLIS_PACKS.map((pack) => (
              <PricingCard key={pack.id} pack={pack} />
            ))}
          </div>
        </div>
      </section>

      <section id="privacidad" className="border-b border-[var(--brand-border)] brand-gradient">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-3">
            <SectionEyebrow>Privacidad</SectionEyebrow>
            <h2 className="text-3xl font-semibold sm:text-4xl">Ayuda sin vigilancia.</h2>
            <p className="text-base leading-7 text-[var(--brand-muted)]">
              HelPlis no contiene GPS ni rastrea permanentemente. La ficha muestra solo lo que configures.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {confidencePoints.map(([title, text, Icon]) => (
              <Card key={title} className="p-5">
                <Icon aria-hidden className="h-6 w-6 text-[var(--brand-accent)]" />
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--brand-muted)]">{text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="instituciones" className="border-b border-[var(--brand-border)] bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="space-y-3">
            <SectionEyebrow>Instituciones</SectionEyebrow>
            <h2 className="text-3xl font-semibold sm:text-4xl">Colegios, jardines y organizaciones.</h2>
            <p className="max-w-2xl text-base leading-7 text-[var(--brand-muted)]">
              Podemos preparar condiciones especiales según cantidad, sin publicar descuentos fijos todavía.
            </p>
          </div>
          <ButtonLink href="/quiero-helplis?source=institution_cta" variant="accent" data-funnel-event="INSTITUTION_CTA_CLICKED">
            <School aria-hidden className="h-4 w-4" />
            Solicitar cotización institucional
          </ButtonLink>
        </div>
      </section>

      <section id="faq" className="border-b border-[var(--brand-border)] bg-white">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <SectionEyebrow>Preguntas frecuentes</SectionEyebrow>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Dudas antes de comprar</h2>
          <div className="mt-8 grid gap-4">
            {visibleFaqs.map((faq) => (
              <Card key={faq.question} className="p-5">
                <h3 className="font-semibold">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--brand-muted)]">{faq.answer}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase text-[var(--brand-accent)]">Compra única desde $18.000</p>
            <h2 className="mt-2 text-3xl font-semibold">Lista para pedir tu HelPlis.</h2>
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
