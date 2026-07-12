import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { createSupportMessageAction } from "@/features/contacts/support-actions";
import { OFFICIAL_CONTACT } from "@/lib/constants";

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="brand-gradient min-h-screen px-4 py-8">
      <div className="mx-auto grid max-w-5xl gap-6">
        <div className="flex items-center justify-between gap-4">
          <BrandLogo className="h-10" />
          <Link href="/" className="text-sm font-medium text-[var(--brand-muted)] underline">
            Volver
          </Link>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <Card className="p-5">
            <h1 className="text-2xl font-semibold">Soporte HelPlis</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--brand-muted)]">
              Cuéntanos qué necesitas revisar. En este MVP el mensaje queda registrado como evento local para seguimiento.
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
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Categoria">
                  <Select name="category" defaultValue="OTHER">
                    {["ACTIVATION", "ORDER", "SHIPPING", "PAYMENT", "DEVICE", "PROFILE", "PRIVACY", "LOST_DEVICE", "INSTITUTION", "OTHER"].map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Prioridad">
                  <Select name="priority" defaultValue="NORMAL">
                    {["LOW", "NORMAL", "HIGH", "URGENT"].map((priority) => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Codigo pulsera opcional">
                  <Input name="publicCode" />
                </Field>
                <Field label="Pedido opcional">
                  <Input name="orderNumber" placeholder="HLP-..." />
                </Field>
              </div>
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
            <Card className="p-5">
              <h2 className="font-semibold">Contacto oficial</h2>
              <div className="mt-3 grid gap-2 text-sm text-[var(--brand-muted)]">
                <p>{OFFICIAL_CONTACT.name}</p>
                <p className="flex items-center gap-2">
                  <Mail aria-hidden className="h-4 w-4" /> {OFFICIAL_CONTACT.email}
                </p>
                <p className="flex items-center gap-2">
                  <Phone aria-hidden className="h-4 w-4" /> {OFFICIAL_CONTACT.phoneDisplay}
                </p>
                <p>{OFFICIAL_CONTACT.site}</p>
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="font-semibold">Preguntas frecuentes</h2>
              <div className="mt-3 grid gap-3 text-sm leading-6 text-[var(--brand-muted)]">
                <p>
                  <strong>¿Se envían mensajes reales?</strong>
                  <br />
                  No todavía. El MVP registra notificaciones locales para validar el flujo.
                </p>
                <p>
                  <strong>¿La ubicación se pide sola?</strong>
                  <br />
                  No. Solo se solicita después de pulsar el botón explícito en la ficha pública.
                </p>
                <p>
                  <strong>¿Supabase ya está listo?</strong>
                  <br />
                  La integración queda preparada por documentación y variables; los secretos no se publican en Git.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
