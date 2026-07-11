import Link from "next/link";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { createOrganizationAction } from "@/features/admin/actions";
import { formatPercent } from "@/lib/formatting/format";
import { prisma } from "@/server/db/client";

export default async function AdminOrganizationsPage() {
  const organizations = await prisma.organization.findMany({
    include: { _count: { select: { devices: true, campaigns: true, memberships: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Organizaciones</h1>
        <p className="mt-1 text-sm text-neutral-600">Base para colegios, jardines, veterinarias, empresas y comunidades.</p>
      </header>
      <Card>
        <h2 className="mb-4 text-lg font-semibold">Crear organización</h2>
        <form action={createOrganizationAction} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre"><Input name="name" required /></Field>
            <Field label="Slug"><Input name="slug" required placeholder="colegio-demo" /></Field>
            <Field label="Tipo">
              <Select name="type">
                {["SCHOOL","KINDERGARTEN","SPORTS_ACADEMY","CLUB","MEDICAL_CENTER","FOUNDATION","VETERINARY","MUNICIPALITY","COMMUNITY","COMPANY","OTHER"].map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </Select>
            </Field>
            <Field label="Código descuento"><Input name="discountCode" /></Field>
            <Field label="Descuento %"><Input name="discountPercentage" type="number" defaultValue={0} /></Field>
            <Field label="Comisión %"><Input name="commissionPercentage" type="number" defaultValue={0} /></Field>
            <Field label="Contacto"><Input name="contactName" /></Field>
            <Field label="Correo"><Input name="contactEmail" type="email" /></Field>
            <Field label="Teléfono"><Input name="contactPhone" type="tel" /></Field>
          </div>
          <Field label="Título landing"><Input name="landingTitle" /></Field>
          <Field label="Descripción landing"><Textarea name="landingDescription" /></Field>
          <Button type="submit">Crear organización</Button>
        </form>
      </Card>
      <div className="grid gap-3">
        {organizations.map((organization) => (
          <Card key={organization.id} className="grid gap-2 lg:grid-cols-[1fr_auto]">
            <div>
              <h2 className="font-semibold">{organization.name}</h2>
              <p className="text-sm text-neutral-600">
                {organization.type} · {organization.discountCode ?? "sin código"} · {formatPercent(organization.discountPercentage)}
              </p>
              <p className="text-xs text-neutral-500">
                {organization._count.devices} dispositivos · {organization._count.campaigns} campañas · {organization._count.memberships} miembros
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={statusTone(organization.status)}>{organization.status}</Badge>
              <Link className="rounded-md border border-neutral-300 px-3 py-2 text-sm" href={`/o/${organization.slug}`}>
                Landing
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
