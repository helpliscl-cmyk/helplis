import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Battery,
  Building2,
  CheckCircle2,
  Contact,
  KeyRound,
  LocateFixed,
  LockKeyhole,
  QrCode,
  ShieldCheck,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { OFFICIAL_CONTACT, OFFICIAL_DOMAIN, PROJECT_NAME } from "@/lib/constants";

const benefits: Array<[string, string, LucideIcon]> = [
  ["QR + NFC", "Dos formas simples de abrir la ficha desde un teléfono compatible.", QrCode],
  ["Sin batería", "La pulsera no necesita carga, batería interna ni mantenimiento eléctrico.", Battery],
  ["Sin app obligatoria", "Quien escanea puede ayudar desde el navegador del teléfono.", Smartphone],
  ["Ficha actualizable", "La información se puede ajustar sin cambiar la pulsera.", CheckCircle2],
  ["Privacidad configurable", "El propietario decide qué datos mostrar y qué acciones permitir.", LockKeyhole],
  ["Ubicación voluntaria", "La ubicación corresponde al teléfono de quien escanea y solo se envía si acepta.", LocateFixed],
];

const steps = [
  ["Escanea", "La persona que encuentra usa el QR o NFC."],
  ["Revisa la ficha", "Ve solo la información autorizada para ese perfil."],
  ["Contacta", "Puede llamar, abrir WhatsApp o dejar un aviso."],
  ["Comparte ubicación", "Si quiere ayudar más, autoriza enviar su ubicación actual."],
  ["Ayuda al reencuentro", "El responsable recibe información clara para actuar rápido."],
];

const useCases = [
  ["Niños", "Identificación y contacto para salidas, paseos y actividades."],
  ["Adultos mayores", "Datos de contacto e instrucciones visibles si alguien necesita orientar."],
  ["Información médica", "Notas autorizadas como alergias, medicamentos o indicaciones importantes."],
  ["Mascotas", "Una ficha actualizable para collar, placa o tag."],
  ["Equipaje", "Contacto del responsable sin publicar datos innecesarios."],
  ["Objetos", "Mochilas, llaves y activos que necesitan una via de devolucion."],
];

const institutionTypes = ["Colegios", "Jardines", "Academias", "Fundaciones", "Municipalidades", "Empresas"];

const faqs = [
  [
    "La pulsera tiene GPS?",
    "No. HelPlis no rastrea constantemente. Puede registrar la ubicación del teléfono de quien escanea solo si esa persona autoriza compartirla.",
  ],
  [
    "Hay que instalar una aplicación?",
    "No es obligatorio. La ficha pública se abre desde el navegador mediante QR o NFC.",
  ],
  [
    "Qué información se muestra?",
    "Solo la información autorizada por el propietario: instrucciones, contactos, datos médicos opcionales y botones permitidos.",
  ],
  [
    "Sirve para mascotas u objetos?",
    "Si. El perfil puede configurarse para personas, mascotas, equipaje, llaves u otros objetos.",
  ],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--brand-background)] text-[var(--brand-text)]">
      <header className="sticky top-0 z-30 border-b border-[var(--brand-border)] bg-white/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <BrandLogo priority className="h-9 sm:h-10" />
          <nav className="hidden items-center gap-5 text-sm font-medium text-[var(--brand-muted)] lg:flex">
            <a href="#como-funciona" className="hover:text-[var(--brand-primary-dark)]">Cómo funciona</a>
            <a href="#usos" className="hover:text-[var(--brand-primary-dark)]">Usos</a>
            <Link href="/activate" className="hover:text-[var(--brand-primary-dark)]">Activar</Link>
            <a href="#instituciones" className="hover:text-[var(--brand-primary-dark)]">Instituciones</a>
            <a href="#faq" className="hover:text-[var(--brand-primary-dark)]">Preguntas frecuentes</a>
          </nav>
          <div className="flex items-center gap-2">
            <ButtonLink href="/login" variant="ghost" className="hidden sm:inline-flex">
              Iniciar sesión
            </ButtonLink>
            <ButtonLink href="/activate" variant="accent">
              <KeyRound aria-hidden className="h-4 w-4" />
              Activar
            </ButtonLink>
          </div>
        </div>
      </header>

      <section className="relative isolate overflow-hidden border-b border-[var(--brand-border)] bg-white">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/brand/optimized/helplis-bracelet-campaign.webp"
            alt="Pulsera HelPlis con QR, logo y NFC"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/88 to-white/46" />
        </div>
        <div className="mx-auto grid min-h-[76svh] max-w-7xl content-center gap-8 px-4 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:py-20">
          <div className="max-w-2xl space-y-7">
            <p className="inline-flex rounded-full border border-[var(--brand-border)] bg-white/85 px-3 py-1 text-sm font-medium text-[var(--brand-primary-dark)]">
              Pequeña pulsera. Gran ayuda.
            </p>
            <div className="space-y-4">
              <h1 className="text-5xl font-semibold leading-tight tracking-normal text-[var(--brand-text)] sm:text-6xl">
                {PROJECT_NAME}
              </h1>
              <p className="max-w-xl text-lg leading-8 text-[var(--brand-muted)]">
                Identificación mediante QR y NFC para conectar rápido a quien encuentra con quien puede ayudar. Sin GPS propio, sin batería y sin aplicación obligatoria.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/activate" variant="accent">
                <KeyRound aria-hidden className="h-4 w-4" />
                Activar una pulsera
              </ButtonLink>
              <ButtonLink href="#como-funciona" variant="secondary">
                <ArrowRight aria-hidden className="h-4 w-4" />
                Ver cómo funciona
              </ButtonLink>
            </div>
            <form action="/p" className="grid max-w-md gap-3 rounded-lg border border-[var(--brand-border)] bg-white/86 p-4 shadow-sm">
              <Field label="Abrir ficha por codigo">
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <Input name="code" placeholder="HLP009" aria-label="Codigo publico" />
                  <Button type="submit" variant="secondary">
                    <QrCode aria-hidden className="h-4 w-4" />
                    Abrir
                  </Button>
                </div>
              </Field>
            </form>
          </div>
          <div className="hidden lg:block" aria-hidden />
        </div>
      </section>

      <section className="border-b border-[var(--brand-border)] bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map(([title, text, Icon]) => (
            <div key={title} className="rounded-lg border border-[var(--brand-border)] bg-white p-5">
              <Icon aria-hidden className="h-6 w-6 text-[var(--brand-accent)]" />
              <h2 className="mt-4 text-base font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--brand-muted)]">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="como-funciona" className="brand-gradient border-b border-[var(--brand-border)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase text-[var(--brand-accent)]">Cómo funciona</p>
            <h2 className="text-3xl font-semibold sm:text-4xl">Un flujo pensado para actuar sin enredo.</h2>
            <p className="text-base leading-7 text-[var(--brand-muted)]">
              La ficha pública prioriza instrucciones, contacto y consentimiento. HelPlis no muestra información privada que el propietario no haya autorizado.
            </p>
          </div>
          <div className="grid gap-3">
            {steps.map(([title, text], index) => (
              <div key={title} className="grid grid-cols-[44px_1fr] gap-4 rounded-lg border border-[var(--brand-border)] bg-white p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#e6fbf9] text-sm font-semibold text-[var(--brand-primary-dark)]">
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[var(--brand-muted)]">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="usos" className="border-b border-[var(--brand-border)] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm font-semibold uppercase text-[var(--brand-accent)]">Usos</p>
            <h2 className="text-3xl font-semibold sm:text-4xl">Personas, mascotas y objetos con una via clara de contacto.</h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {useCases.map(([title, text]) => (
              <Card key={title} className="p-5">
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--brand-muted)]">{text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--brand-border)] bg-[var(--brand-primary-dark)] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="space-y-4">
            <ShieldCheck aria-hidden className="h-8 w-8 text-[var(--brand-primary-light)]" />
            <h2 className="text-3xl font-semibold sm:text-4xl">Privacidad explicada sin letra chica.</h2>
            <p className="text-base leading-7 text-blue-50">
              La pulsera no contiene GPS y no rastrea permanentemente. Si alguien escanea, puede compartir la ubicación de su propio teléfono solo cuando acepta el permiso del navegador.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "El propietario controla qué mostrar.",
              "La ficha puede ocultar datos sensibles.",
              "El codigo secreto no aparece en la ficha publica.",
              "La ubicación no se solicita sin acción voluntaria.",
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
            <h2 className="text-3xl font-semibold sm:text-4xl">Preparado para organizaciones.</h2>
            <p className="text-base leading-7 text-[var(--brand-muted)]">
              El MVP ya contempla organizaciones, lotes, importaciones y campañas. La siguiente fase puede conectar Supabase y despliegue sin cambiar la promesa pública.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {institutionTypes.map((item) => (
              <div key={item} className="rounded-lg border border-[var(--brand-border)] bg-[#f8fbfe] p-4 text-sm font-medium">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="border-b border-[var(--brand-border)] brand-gradient">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <h2 className="text-3xl font-semibold sm:text-4xl">Preguntas frecuentes</h2>
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
            <h2 className="text-3xl font-semibold">Activa o revisa una ficha HelPlis.</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--brand-muted)]">
              Si ya tienes una pulsera, usa el codigo publico y el codigo secreto del empaque para dejarla lista.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/activate" variant="accent">
              <KeyRound aria-hidden className="h-4 w-4" />
              Activar dispositivo
            </ButtonLink>
            <ButtonLink href="/support" variant="secondary">
              <Contact aria-hidden className="h-4 w-4" />
              Contactar soporte
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
