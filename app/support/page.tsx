import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { createSupportMessageAction } from "@/features/contacts/support-actions";
import { OFFICIAL_CONTACT } from "@/lib/constants";

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-8">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <Link href="/" className="text-sm text-neutral-600 underline">Volver</Link>
          <h1 className="mt-4 text-2xl font-semibold">Soporte HelPlis</h1>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Formulario local provisional. El mensaje se guarda en SQLite y genera una notificación local.
          </p>
          {params.sent ? (
            <p className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              Mensaje registrado localmente.
            </p>
          ) : null}
          {params.error ? (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              Revisa los datos del formulario.
            </p>
          ) : null}
          <form action={createSupportMessageAction} className="mt-5 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre">
                <Input name="name" required />
              </Field>
              <Field label="Correo">
                <Input name="email" type="email" required />
              </Field>
            </div>
            <Field label="Teléfono">
              <Input name="phone" type="tel" />
            </Field>
            <Field label="Asunto">
              <Input name="subject" required />
            </Field>
            <Field label="Mensaje">
              <Textarea name="message" required />
            </Field>
            <Button type="submit">Registrar mensaje</Button>
          </form>
        </Card>
        <div className="grid gap-4">
          <Card>
            <h2 className="font-semibold">Contacto provisional</h2>
            <div className="mt-3 grid gap-2 text-sm text-neutral-700">
              <p>{OFFICIAL_CONTACT.name}</p>
              <p className="flex items-center gap-2"><Mail aria-hidden className="h-4 w-4" /> {OFFICIAL_CONTACT.email}</p>
              <p className="flex items-center gap-2"><Phone aria-hidden className="h-4 w-4" /> {OFFICIAL_CONTACT.phoneDisplay}</p>
              <p>{OFFICIAL_CONTACT.site}</p>
            </div>
          </Card>
          <Card>
            <h2 className="font-semibold">Preguntas frecuentes</h2>
            <div className="mt-3 grid gap-3 text-sm leading-6 text-neutral-700">
              <p><strong>¿Se envían mensajes reales?</strong><br />No. Este MVP usa notificaciones locales.</p>
              <p><strong>¿La ubicación se pide sola?</strong><br />No. Solo se solicita después de pulsar el botón explícito.</p>
              <p><strong>¿Puedo conectar Supabase?</strong><br />Sí. La arquitectura deja repositorios y planes documentados para migrar.</p>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
