import { ArrowRight, Contact, KeyRound, LogIn, QrCode, ShieldCheck } from "lucide-react";
import { OFFICIAL_CONTACT, OFFICIAL_DOMAIN, PROJECT_NAME } from "@/lib/constants";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="mx-auto grid min-h-[88vh] max-w-6xl content-center gap-8 px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">MVP local provisional</p>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-normal text-neutral-950 sm:text-5xl">
                {PROJECT_NAME}
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-neutral-700">
                Identificación y contacto mediante QR y NFC.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
              <ButtonLink href="/activate">
                <KeyRound aria-hidden className="h-4 w-4" />
                Activar dispositivo
              </ButtonLink>
              <ButtonLink href="/login" variant="secondary">
                <LogIn aria-hidden className="h-4 w-4" />
                Iniciar sesión
              </ButtonLink>
              <ButtonLink href="/support" variant="secondary">
                <Contact aria-hidden className="h-4 w-4" />
                Contactar
              </ButtonLink>
              <ButtonLink href="#como-funciona" variant="secondary">
                <ArrowRight aria-hidden className="h-4 w-4" />
                Cómo funciona
              </ButtonLink>
            </div>
          </div>
          <Card className="grid gap-4">
            <CardHeader>
              <CardTitle>Escanear código manualmente</CardTitle>
              <CardDescription>
                Para pruebas locales, ingresa un publicCode demo como HLP001, HLP003 o HLP009.
              </CardDescription>
            </CardHeader>
            <form action="/p" className="grid gap-3">
              <Field label="Código público">
                <Input name="code" placeholder="HLP001" />
              </Field>
              <Button type="submit">
                <QrCode aria-hidden className="h-4 w-4" />
                Abrir ficha
              </Button>
            </form>
            <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm leading-6 text-neutral-700">
              <strong className="text-neutral-950">Contacto provisional:</strong>
              <br />
              {OFFICIAL_CONTACT.name}
              <br />
              {OFFICIAL_CONTACT.email}
              <br />
              {OFFICIAL_CONTACT.phoneDisplay}
              <br />
              {OFFICIAL_DOMAIN.replace("https://", "")}
            </div>
          </Card>
        </div>
      </section>
      <section id="como-funciona" className="border-t border-neutral-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-10 sm:grid-cols-3">
          {[
            ["1", "Activación segura", "El publicCode visible se combina con un código secreto de un solo uso."],
            ["2", "Ficha pública", "La persona que escanea ve solo la información autorizada por privacidad."],
            ["3", "Contacto y ubicación", "Llamadas, WhatsApp y ubicación se registran con consentimiento explícito."],
          ].map(([step, title, text]) => (
            <Card key={step}>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-neutral-100 text-sm font-semibold">
                {step}
              </div>
              <h2 className="text-base font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">{text}</p>
            </Card>
          ))}
        </div>
      </section>
      <footer className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-6 text-sm text-neutral-600">
          <ShieldCheck aria-hidden className="h-4 w-4" />
          Plataforma local preparada para Supabase, Vercel, Cloudflare y GitHub.
        </div>
      </footer>
    </main>
  );
}
