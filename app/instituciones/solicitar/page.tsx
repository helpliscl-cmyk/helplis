import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { createInstitutionLeadAction } from "@/features/institutions/actions";

export default async function InstitutionRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="min-h-screen bg-[var(--brand-background)] px-4 py-8">
      <div className="mx-auto grid max-w-4xl gap-6">
        <header className="flex items-center justify-between gap-4">
          <BrandLogo className="h-10" />
          <Link href="/instituciones" className="text-sm font-medium text-[var(--brand-muted)] underline">
            Instituciones
          </Link>
        </header>
        <Card>
          <h1 className="text-2xl font-semibold">Solicitud institucional</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--brand-muted)]">
            No publicamos descuentos definitivos desde este formulario. Sirve para dimensionar piloto, campana y soporte.
          </p>
          {params.sent ? <p className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">Solicitud registrada.</p> : null}
          {params.error ? <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">Revisa los datos.</p> : null}
          <form action={createInstitutionLeadAction} className="mt-5 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Institucion"><Input name="institutionName" required /></Field>
              <Field label="Tipo">
                <Select name="type" defaultValue="SCHOOL">
                  {["SCHOOL", "KINDERGARTEN", "SPORTS_ACADEMY", "CLUB", "FOUNDATION", "MUNICIPALITY", "COMMUNITY", "COMPANY", "OTHER"].map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Region"><Input name="region" required /></Field>
              <Field label="Comuna"><Input name="comuna" required /></Field>
              <Field label="Contacto"><Input name="contactName" required /></Field>
              <Field label="Cargo"><Input name="contactRole" /></Field>
              <Field label="Telefono"><Input name="phone" required /></Field>
              <Field label="Correo"><Input name="email" type="email" required /></Field>
              <Field label="Cantidad estimada"><Input name="estimatedQuantity" type="number" min={1} required /></Field>
              <Field label="Fecha estimada"><Input name="estimatedDate" type="date" /></Field>
            </div>
            <Field label="Interes"><Input name="interest" required placeholder="Piloto, campana, compra coordinada..." /></Field>
            <Field label="Observaciones"><Textarea name="notes" /></Field>
            <Button type="submit">Enviar solicitud</Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
