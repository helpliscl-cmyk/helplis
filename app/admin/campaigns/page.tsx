import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { createCampaignAction } from "@/features/admin/actions";
import { formatPercent } from "@/lib/formatting/format";
import { prisma } from "@/server/db/client";

export default async function AdminCampaignsPage() {
  const [organizations, campaigns] = await Promise.all([
    prisma.organization.findMany({ orderBy: { name: "asc" } }),
    prisma.campaign.findMany({ include: { organization: true }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Campañas</h1>
        <p className="mt-1 text-sm text-neutral-600">Descuentos y comisiones institucionales sin pagos todavía.</p>
      </header>
      <Card>
        <h2 className="mb-4 text-lg font-semibold">Crear campaña</h2>
        <form action={createCampaignAction} className="grid gap-4">
          <Field label="Organización">
            <Select name="organizationId" required>
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>{organization.name}</option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre"><Input name="name" required /></Field>
            <Field label="Slug"><Input name="slug" required /></Field>
            <Field label="Código"><Input name="discountCode" /></Field>
            <Field label="Descuento %"><Input name="discountPercentage" type="number" defaultValue={0} /></Field>
            <Field label="Comisión %"><Input name="commissionPercentage" type="number" defaultValue={0} /></Field>
          </div>
          <Field label="Descripción"><Textarea name="description" /></Field>
          <Button type="submit">Crear campaña</Button>
        </form>
      </Card>
      <div className="grid gap-3">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <div>
              <h2 className="font-semibold">{campaign.name}</h2>
              <p className="text-sm text-neutral-600">
                {campaign.organization.name} · {campaign.discountCode ?? "sin código"} · {formatPercent(campaign.discountPercentage)}
              </p>
            </div>
            <Badge tone={statusTone(campaign.status)}>{campaign.status}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
