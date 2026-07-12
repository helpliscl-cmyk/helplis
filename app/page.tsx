import type { Metadata } from "next";
import Image from "next/image";
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
  LocateFixed,
  LockKeyhole,
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
import { BrandLogo } from "@/components/brand/brand-logo";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OFFICIAL_CONTACT, OFFICIAL_DOMAIN } from "@/lib/constants";

export const metadata: Metadata = {
  title: "HelPlis | Pulsera inteligente con QR y NFC",
  description:
    "Pulsera inteligente con QR y NFC para identificar personas y facilitar el contacto con su familia. Sin bateria y sin aplicacion obligatoria.",
  alternates: {
    canonical: "https://helplis.cl",
  },
  openGraph: {
    title: "HelPlis | Pulsera inteligente con QR y NFC",
    description:
      "Pulsera inteligente con QR y NFC para identificar personas y facilitar el contacto con su familia.",
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

const quickBenefits = [
  "Sin bateria",
  "Sin aplicacion obligatoria",
  "Informacion actualizable",
  "Ubicacion compartida voluntariamente",
];

const problemScenarios: Array<[string, string, LucideIcon]> = [
  ["Un nino se separa", "En una plaza, paseo o salida escolar, la persona que lo encuentre necesita saber a quien llamar.", Baby],
  ["Un adulto mayor se desorienta", "La pulsera puede mostrar instrucciones simples y contactos autorizados.", UserRound],
  ["Alguien necesita asistencia", "Datos medicos opcionales y mensajes claros ayudan cuando explicar todo cuesta.", HeartPulse],
  ["Una mascota se extravia", "Quien la encuentre puede abrir una ficha y contactar al responsable.", Dog],
  ["Una mochila queda atras", "Objetos y equipaje tambien pueden tener una forma clara de volver.", Package],
];

const solutionPoints: Array<[string, string, LucideIcon]> = [
  ["QR visible", "Cualquier telefono con camara puede abrir la ficha publica.", QrCode],
  ["NFC compatible", "En telefonos compatibles, basta acercar el dispositivo a la pulsera.", Smartphone],
  ["Perfil digital", "La informacion se actualiza sin cambiar la pulsera.", Contact],
  ["Contacto rapido", "La ficha puede mostrar botones de llamada, WhatsApp o aviso.", Users],
  ["Ubicacion voluntaria", "Quien escanea decide si comparte la ubicacion de su propio telefono.", MapPin],
  ["Sin bateria", "No necesita carga, pila ni mantenimiento electrico.", Battery],
];

const steps = [
  ["Activas y configuras", "Ingresas el codigo de la pulsera y decides que informacion mostrar."],
  ["Alguien escanea", "La persona que encuentra usa el QR o NFC desde su telefono."],
  ["Te contacta", "Puede llamar, escribir o compartir ubicacion si acepta hacerlo."],
];

const useCases: Array<[string, string, LucideIcon, "primary" | "secondary"]> = [
  ["Ninos", "Para salidas, colegios, paseos y momentos donde un contacto rapido puede hacer la diferencia.", Baby, "primary"],
  ["Adultos mayores", "Para personas que pueden desorientarse y necesitan instrucciones simples a la vista.", UserRound, "primary"],
  ["Personas que necesiten asistencia", "Para datos medicos opcionales, contactos y mensajes de apoyo autorizados.", HeartPulse, "primary"],
  ["Mascotas", "Para collar, placa o tag con informacion actualizable.", Dog, "secondary"],
  ["Equipaje", "Para maletas, mochilas y viajes donde publicar datos de mas no conviene.", Briefcase, "secondary"],
  ["Objetos", "Para llaves, bolsos y activos que necesitan una via de devolucion.", Package, "secondary"],
];

const productFeatures = [
  "Pulsera con QR visible",
  "Acceso NFC en telefonos compatibles",
  "Perfil digital editable",
  "Contactos y mensajes autorizados",
  "No requiere bateria",
  "No obliga a instalar una app",
];

const trustSignals: Array<[string, string, LucideIcon]> = [
  ["QR + NFC", "Dos formas de acceso para aumentar compatibilidad.", QrCode],
  ["Contacto directo", "La ficha prioriza acciones simples: llamar, WhatsApp o aviso.", Contact],
  ["Datos actualizables", "Puedes ajustar informacion sin cambiar la pulsera.", CheckCircle2],
  ["Pensado en Chile", "Comunicacion y soporte directo para una etapa inicial cercana.", MapPin],
];

const faqs = [
  ["¿Tiene GPS?", "No. La pulsera no contiene GPS ni hace rastreo permanente."],
  ["¿Necesita bateria?", "No. El QR y el NFC funcionan sin bateria interna ni carga electrica."],
  ["¿Hay que instalar una aplicacion?", "No es obligatorio. La ficha publica se abre desde el navegador del telefono."],
  ["¿Que pasa si el telefono no tiene NFC?", "El QR visible sigue siendo la alternativa universal para abrir la ficha."],
  ["¿Puedo cambiar la informacion?", "Si. La ficha digital esta pensada para actualizar datos y contactos autorizados."],
  ["¿Que datos vera quien escanee?", "Solo la informacion que decidas mostrar en la ficha publica."],
  ["¿La ubicacion se comparte automaticamente?", "No. Quien escanea debe aceptar compartir la ubicacion de su propio telefono."],
  ["¿Sirve fuera de Chile?", "La ficha se abre por internet. La disponibilidad depende de conexion y compatibilidad del telefono."],
  ["¿Como se activa?", "Con el codigo publico y el codigo secreto incluido con la pulsera."],
  ["¿Puedo comprar para un colegio?", "Si. Puedes solicitar una alianza institucional para revisar cantidades y acompaniamiento."],
  ["¿Tiene costo mensual?", "La definicion comercial final aun no esta publicada. Por ahora puedes dejar tu interes y recibir novedades."],
];

function SectionEyebrow({ children }: { children: string }) {
  return <p className="text-sm font-semibold uppercase text-[var(--brand-accent)]">{children}</p>;
}

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--brand-border)] bg-white/94 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <BrandLogo priority className="h-9 sm:h-10" />
        <nav className="hidden items-center gap-5 text-sm font-medium text-[var(--brand-muted)] lg:flex">
          <a href="#como-funciona" className="hover:text-[var(--brand-primary-dark)]">Como funciona</a>
          <a href="#usos" className="hover:text-[var(--brand-primary-dark)]">Para quien sirve</a>
          <a href="#pulsera" className="hover:text-[var(--brand-primary-dark)]">Pulsera</a>
          <a href="#instituciones" className="hover:text-[var(--brand-primary-dark)]">Instituciones</a>
          <a href="#faq" className="hover:text-[var(--brand-primary-dark)]">Preguntas frecuentes</a>
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <ButtonLink href="/login" variant="ghost">Iniciar sesion</ButtonLink>
          <ButtonLink href="/activate" variant="secondary">
            <KeyRound aria-hidden className="h-4 w-4" />
            Activar
          </ButtonLink>
          <ButtonLink href="/quiero-helplis" variant="accent">
            <ShoppingBag aria-hidden className="h-4 w-4" />
            Quiero mi HelPlis
          </ButtonLink>
        </div>
        <details className="group relative md:hidden">
          <summary className="inline-flex min-h-11 cursor-pointer list-none items-center justify-center rounded-md border border-[var(--brand-border)] bg-white px-3 text-[var(--brand-text)]">
            <Menu aria-hidden className="h-5 w-5" />
            <span className="sr-only">Abrir menu</span>
          </summary>
          <div className="absolute right-0 top-13 grid w-[min(86vw,320px)] gap-2 rounded-lg border border-[var(--brand-border)] bg-white p-3 text-sm font-medium shadow-lg">
            <a href="#como-funciona" className="rounded-md px-3 py-2 hover:bg-[#edf8fb]">Como funciona</a>
            <a href="#usos" className="rounded-md px-3 py-2 hover:bg-[#edf8fb]">Para quien sirve</a>
            <a href="#pulsera" className="rounded-md px-3 py-2 hover:bg-[#edf8fb]">Pulsera</a>
            <a href="#instituciones" className="rounded-md px-3 py-2 hover:bg-[#edf8fb]">Instituciones</a>
            <a href="#faq" className="rounded-md px-3 py-2 hover:bg-[#edf8fb]">Preguntas frecuentes</a>
            <div className="mt-2 grid gap-2 border-t border-[var(--brand-border)] pt-3">
              <ButtonLink href="/quiero-helplis" variant="accent">
                <ShoppingBag aria-hidden className="h-4 w-4" />
                Quiero mi HelPlis
              </ButtonLink>
              <ButtonLink href="/activate" variant="secondary">
                <KeyRound aria-hidden className="h-4 w-4" />
                Activar
              </ButtonLink>
              <ButtonLink href="/login" variant="ghost">Iniciar sesion</ButtonLink>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--brand-background)] text-[var(--brand-text)]">
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
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/86 to-white/38" />
        </div>
        <div className="mx-auto grid min-h-[76svh] max-w-7xl content-center gap-8 px-4 py-14 lg:py-20">
          <div className="max-w-2xl space-y-7">
            <p className="inline-flex rounded-full border border-[var(--brand-border)] bg-white/85 px-3 py-1 text-sm font-medium text-[var(--brand-primary-dark)]">
              Pulsera inteligente con QR + NFC
            </p>
            <div className="space-y-4">
              <h1 className="text-5xl font-semibold leading-tight tracking-normal text-[var(--brand-text)] sm:text-6xl">
                Si se pierde, ayudale a volver.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-[var(--brand-muted)]">
                HelPlis permite que quien encuentre a una persona acceda a la informacion autorizada y contacte rapido a su familia.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/quiero-helplis" variant="accent">
                <ShoppingBag aria-hidden className="h-4 w-4" />
                Quiero mi HelPlis
              </ButtonLink>
              <ButtonLink href="#como-funciona" variant="secondary">
                <ArrowRight aria-hidden className="h-4 w-4" />
                Ver como funciona
              </ButtonLink>
            </div>
            <ul className="grid max-w-xl gap-2 text-sm font-medium text-[var(--brand-text)] sm:grid-cols-2">
              {quickBenefits.map((item) => (
                <li key={item} className="flex items-center gap-2 rounded-md bg-white/82 px-3 py-2">
                  <CheckCircle2 aria-hidden className="h-4 w-4 text-[var(--brand-accent)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--brand-border)] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="max-w-3xl space-y-3">
            <SectionEyebrow>El problema</SectionEyebrow>
            <h2 className="text-3xl font-semibold sm:text-4xl">A veces basta un momento para necesitar ayuda clara.</h2>
            <p className="text-base leading-7 text-[var(--brand-muted)]">
              HelPlis esta pensado para situaciones cotidianas donde alguien necesita identificar, contactar y actuar sin enredo.
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
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="space-y-3">
            <SectionEyebrow>La solucion</SectionEyebrow>
            <h2 className="text-3xl font-semibold sm:text-4xl">Una pulsera que abre una ficha de ayuda en segundos.</h2>
            <p className="text-base leading-7 text-[var(--brand-muted)]">
              Quien escanea ve solo la informacion autorizada: contactos, instrucciones, datos opcionales y acciones para avisar.
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

      <section id="como-funciona" className="border-b border-[var(--brand-border)] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
            <div className="space-y-3">
              <SectionEyebrow>Como funciona</SectionEyebrow>
              <h2 className="text-3xl font-semibold sm:text-4xl">Tres pasos para quedar listo.</h2>
              <p className="text-base leading-7 text-[var(--brand-muted)]">
                La tecnologia queda atras. Lo importante es que la persona correcta pueda contactar rapido.
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
          <div className="mt-8">
            <ButtonLink href="/quiero-helplis" variant="accent">
              <ShoppingBag aria-hidden className="h-4 w-4" />
              Quiero mi HelPlis
            </ButtonLink>
          </div>
        </div>
      </section>

      <section id="usos" className="border-b border-[var(--brand-border)] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="max-w-3xl space-y-3">
            <SectionEyebrow>Para quien sirve</SectionEyebrow>
            <h2 className="text-3xl font-semibold sm:text-4xl">Primero personas. Tambien mascotas, equipaje y objetos.</h2>
            <p className="text-base leading-7 text-[var(--brand-muted)]">
              La etapa inicial prioriza ninos, adultos mayores y personas que necesitan asistencia, sin cerrar otros usos utiles.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {useCases.map(([title, text, Icon, priority]) => (
              <Card
                key={title}
                className={priority === "primary" ? "border-[var(--brand-primary-light)] p-5" : "p-5"}
              >
                <Icon aria-hidden className="h-6 w-6 text-[var(--brand-accent)]" />
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--brand-muted)]">{text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="pulsera" className="border-b border-[var(--brand-border)] bg-[#071b3a] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[1fr_1fr] lg:items-center">
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
            <h2 className="text-3xl font-semibold sm:text-4xl">Pequena pulsera. Gran ayuda.</h2>
            <p className="text-base leading-7 text-blue-50">
              El producto esta preparado para identificar mediante QR y NFC, abrir una ficha digital y facilitar contacto rapido.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {productFeatures.map((item) => (
                <div key={item} className="flex items-start gap-2 rounded-lg border border-white/16 bg-white/8 p-3 text-sm text-blue-50">
                  <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 text-[var(--brand-primary-light)]" />
                  {item}
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-white/16 bg-white/8 p-4 text-sm leading-6 text-blue-50">
              Precio final y disponibilidad: muy pronto. Deja tu interes y te avisaremos cuando abramos preventa o compra.
            </div>
            <ButtonLink href="/quiero-helplis" variant="accent">
              <ShoppingBag aria-hidden className="h-4 w-4" />
              Quiero recibir novedades
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--brand-border)] bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-3">
            <SectionEyebrow>Por que HelPlis</SectionEyebrow>
            <h2 className="text-3xl font-semibold sm:text-4xl">Simple para quien ayuda. Controlado por ti.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "No necesita bateria ni carga.",
              "No requiere instalar una aplicacion para escanear.",
              "La informacion puede actualizarse.",
              "La privacidad se configura segun cada perfil.",
              "NFC facilita el acceso en telefonos compatibles.",
              "QR funciona como alternativa universal.",
            ].map((item) => (
              <div key={item} className="rounded-lg border border-[var(--brand-border)] bg-[#f8fbfe] p-4 text-sm font-medium">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--brand-border)] bg-[var(--brand-primary-dark)] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="space-y-4">
            <ShieldCheck aria-hidden className="h-8 w-8 text-[var(--brand-primary-light)]" />
            <h2 className="text-3xl font-semibold sm:text-4xl">Privacidad para ayudar, no para vigilar.</h2>
            <p className="text-base leading-7 text-blue-50">
              La pulsera no contiene GPS y no rastrea permanentemente. Si alguien escanea, puede compartir la ubicacion de su propio telefono solo si acepta.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Tu decides que informacion mostrar.",
              "El domicilio no debe mostrarse de forma predeterminada.",
              "Los datos se pueden actualizar.",
              "La ubicacion no se comparte automaticamente.",
            ].map((item) => (
              <div key={item} className="rounded-lg border border-white/18 bg-white/8 p-4 text-sm leading-6 text-blue-50">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="instituciones" className="border-b border-[var(--brand-border)] bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-4">
            <Building2 aria-hidden className="h-8 w-8 text-[var(--brand-accent)]" />
            <SectionEyebrow>Instituciones</SectionEyebrow>
            <h2 className="text-3xl font-semibold sm:text-4xl">Soluciones para colegios e instituciones.</h2>
            <p className="text-base leading-7 text-[var(--brand-muted)]">
              Revisemos una alianza para entregar identificacion, acompanamiento de activacion y beneficios por comunidad.
            </p>
            <div className="grid gap-2 text-sm leading-6 text-[var(--brand-muted)]">
              {[
                "Beneficio o descuento por institucion cuando este definido.",
                "Codigo o landing institucional para ordenar solicitudes.",
                "Acompanamiento para activar pulseras y resolver dudas.",
              ].map((item) => (
                <p key={item} className="flex items-start gap-2">
                  <CheckCircle2 aria-hidden className="mt-1 h-4 w-4 text-[var(--brand-accent)]" />
                  <span>{item}</span>
                </p>
              ))}
            </div>
            <ButtonLink href="/quiero-helplis?tipo=institucion" variant="accent">
              <School aria-hidden className="h-4 w-4" />
              Solicitar alianza institucional
            </ButtonLink>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {["Colegios", "Jardines", "Academias deportivas", "Fundaciones", "Municipalidades", "Empresas"].map((item) => (
              <div key={item} className="rounded-lg border border-[var(--brand-border)] bg-[#f8fbfe] p-4 text-sm font-medium">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--brand-border)] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="max-w-3xl space-y-3">
            <SectionEyebrow>Confianza inicial</SectionEyebrow>
            <h2 className="text-3xl font-semibold sm:text-4xl">Senales reales mientras crece la comunidad.</h2>
            <p className="text-base leading-7 text-[var(--brand-muted)]">
              Aun no mostramos testimonios inventados. Esta seccion quedara lista para historias verificadas.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <section id="faq" className="border-b border-[var(--brand-border)] brand-gradient">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <SectionEyebrow>Preguntas frecuentes</SectionEyebrow>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Dudas antes de pedir tu HelPlis</h2>
          <div className="mt-8 grid gap-4">
            {faqs.map(([question, answer]) => (
              <Card key={question} className="p-5">
                <h3 className="font-semibold">{question}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--brand-muted)]">{answer}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 className="text-3xl font-semibold">Una pequena pulsera puede hacer mas facil el reencuentro.</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--brand-muted)]">
              Deja tu interes para recibir novedades de disponibilidad, preventa y opciones para instituciones.
            </p>
            <p className="mt-3 text-sm text-[var(--brand-muted)]">
              ¿Ya tienes una? <a href="/activate" className="font-medium text-[var(--brand-primary-dark)] underline">Activar pulsera</a>.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/quiero-helplis" variant="accent">
              <ShoppingBag aria-hidden className="h-4 w-4" />
              Quiero mi HelPlis
            </ButtonLink>
            <ButtonLink href="/quiero-helplis?tipo=institucion" variant="secondary">
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
            <p>{OFFICIAL_CONTACT.phoneDisplay}</p>
            <p>{OFFICIAL_DOMAIN.replace("https://", "")}</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
