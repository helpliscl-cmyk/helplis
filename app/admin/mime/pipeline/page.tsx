import Link from "next/link";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/field";
import { updateCommercialStatusAction } from "@/features/mime/actions";
import { formatDate } from "@/lib/formatting/format";
import { prisma } from "@/server/db/client";

const STAGES = [
  "SIN_REVISAR",
  "PRIORIZADO",
  "CONTACTO_POR_INVESTIGAR",
  "LISTO_PARA_CONTACTAR",
  "PRIMER_CONTACTO",
  "SEGUIMIENTO",
  "RESPONDIO",
  "REUNION_SOLICITADA",
  "REUNION_AGENDADA",
  "PROPUESTA_ENVIADA",
  "NEGOCIACION",
  "GANADO",
  "PERDIDO",
  "NO_CONTACTAR",
];

export default async function AdminMimePipelinePage() {
  const organizations = await prisma.organization.findMany({
    where: { establishmentId: { not: null } },
    include: { establishment: true, opportunities: { orderBy: { updatedAt: "desc" }, take: 1 } },
    orderBy: [{ commercialStatus: "asc" }, { priority: "desc" }],
    take: 300,
  });

  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Pipeline MIME</h1>
          <p className="mt-1 text-sm text-neutral-600">Etapas iniciales de prospección HelPlis.</p>
        </div>
        <Link className="text-sm font-medium text-[var(--brand-primary-dark)] underline" href="/admin/mime/tasks">
          Cola de tareas
        </Link>
      </header>

      <div className="grid gap-4 xl:grid-cols-2">
        {STAGES.map((stage) => {
          const items = organizations.filter((organization) => organization.commercialStatus === stage);
          return (
            <Card key={stage}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold">{stage.replaceAll("_", " ")}</h2>
                <Badge tone={statusTone(stage)}>{items.length}</Badge>
              </div>
              <div className="mt-3 grid gap-3">
                {items.slice(0, 12).map((organization) => (
                  <div key={organization.id} className="rounded-md border border-[var(--brand-border)] p-3 text-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Link className="font-medium text-[var(--brand-primary-dark)] underline" href={`/admin/mime/establishments/${organization.establishmentId}`}>
                          {organization.name}
                        </Link>
                        <p className="mt-1 text-neutral-600">
                          RBD {organization.establishment?.rbd ?? "sin RBD"} · score {organization.prospectScore} ·{" "}
                          {formatDate(organization.nextActionAt)}
                        </p>
                      </div>
                      <form action={updateCommercialStatusAction} className="flex flex-wrap gap-2">
                        <input type="hidden" name="organizationId" value={organization.id} />
                        <Select name="commercialStatus" defaultValue={organization.commercialStatus} className="min-h-9 text-sm">
                          {STAGES.map((option) => (
                            <option key={option} value={option}>{option.replaceAll("_", " ")}</option>
                          ))}
                        </Select>
                        <Button type="submit" variant="secondary" className="min-h-9 px-3 py-1">
                          Mover
                        </Button>
                      </form>
                    </div>
                  </div>
                ))}
                {!items.length ? <p className="text-sm text-neutral-600">Sin organizaciones en esta etapa.</p> : null}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
