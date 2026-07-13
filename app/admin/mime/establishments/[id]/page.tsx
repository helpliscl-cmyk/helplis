import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckboxField, Field, Input, Select, Textarea } from "@/components/ui/field";
import { addCommercialActivityAction, updateDoNotContactAction } from "@/features/mime/actions";
import { formatDate } from "@/lib/formatting/format";
import { prisma } from "@/server/db/client";

function parseBreakdown(value: string | null | undefined) {
  if (!value) return [];
  try {
    return JSON.parse(value) as Array<{ label: string; matched: boolean; points: number }>;
  } catch {
    return [];
  }
}

export default async function AdminMimeEstablishmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const establishment = await prisma.establishment.findUnique({
    where: { id },
    include: {
      holder: { include: { establishments: { select: { id: true, rbd: true, name: true }, take: 20 } } },
      contacts: { orderBy: { updatedAt: "desc" } },
      scrapeAttempts: { include: { job: true }, orderBy: { startedAt: "desc" }, take: 20 },
      changes: { orderBy: { createdAt: "desc" }, take: 20 },
      commercialOrganizations: {
        include: {
          opportunities: { orderBy: { updatedAt: "desc" } },
          activities: { include: { contact: true }, orderBy: { occurredAt: "desc" }, take: 20 },
        },
        take: 1,
      },
    },
  });

  if (!establishment) notFound();
  const organization = establishment.commercialOrganizations[0];
  const scoreBreakdown = parseBreakdown(organization?.prospectScoreBreakdown);

  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{establishment.name ?? `RBD ${establishment.rbd}`}</h1>
          <p className="mt-1 text-sm text-neutral-600">
            RBD {establishment.rbd} · {establishment.commune ?? "Sin comuna"} · {establishment.region ?? "Sin región"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="text-sm font-medium text-[var(--brand-primary-dark)] underline" href="/admin/mime/establishments">
            Volver
          </Link>
          <a className="inline-flex items-center gap-1 text-sm font-medium text-[var(--brand-primary-dark)] underline" href={establishment.mimeUrl} target="_blank" rel="noreferrer">
            Abrir MIME
            <ExternalLink aria-hidden className="h-3 w-3" />
          </a>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <h2 className="font-semibold">Información institucional</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ["Estado", establishment.status],
              ["Dirección", establishment.address],
              ["Comuna", establishment.commune],
              ["Provincia", establishment.province],
              ["Región", establishment.region],
              ["Dependencia", establishment.dependency],
              ["Reconocimiento oficial", establishment.officialRecognition],
              ["Niveles", establishment.educationLevels],
              ["Matrícula total", establishment.totalEnrollment?.toLocaleString("es-CL")],
              ["Director/a", establishment.directorName],
              ["Correo", establishment.contactEmail],
              ["Teléfono", establishment.phone],
              ["Web", establishment.website],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs uppercase text-neutral-500">{label}</dt>
                <dd className="mt-1 text-sm font-medium">{value ?? "Sin dato"}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card>
          <h2 className="font-semibold">Prospección HelPlis</h2>
          {organization ? (
            <div className="mt-4 grid gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={organization.doNotContact ? "red" : statusTone(organization.commercialStatus)}>
                  {organization.commercialStatus.replaceAll("_", " ")}
                </Badge>
                <span className="text-sm text-neutral-600">Score {organization.prospectScore}</span>
              </div>
              <form action={updateDoNotContactAction} className="grid gap-3">
                <input type="hidden" name="organizationId" value={organization.id} />
                <input type="hidden" name="establishmentId" value={establishment.id} />
                <CheckboxField name="doNotContact" label="No contactar este establecimiento" defaultChecked={organization.doNotContact} />
                <Button type="submit" variant="secondary">Guardar preferencia</Button>
              </form>
              <div className="grid gap-2 text-sm">
                {scoreBreakdown.map((item) => (
                  <div key={item.label} className="flex justify-between gap-3">
                    <span>{item.label}</span>
                    <strong className={item.matched ? "text-green-700" : "text-neutral-500"}>
                      {item.matched ? `+${item.points}` : "0"}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-neutral-600">Se creará una organización comercial al guardar una ficha MIME.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Sostenedor</h2>
          <div className="mt-3 text-sm">
            <p className="font-medium">{establishment.holder?.originalName ?? establishment.holderName ?? "Sin sostenedor"}</p>
            <p className="text-neutral-600">{establishment.holder?.primaryEmail ?? "Sin correo principal"}</p>
            {establishment.holder?.establishments.length ? (
              <div className="mt-3 grid gap-1">
                {establishment.holder.establishments.map((item) => (
                  <Link key={item.id} className="text-[var(--brand-primary-dark)] underline" href={`/admin/mime/establishments/${item.id}`}>
                    RBD {item.rbd} · {item.name ?? "Sin nombre"}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold">Contactos</h2>
          <div className="mt-3 grid gap-2">
            {establishment.contacts.map((contact) => (
              <div key={contact.id} className="rounded-md border border-[var(--brand-border)] p-3 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <strong>{contact.name ?? contact.role ?? "Contacto institucional"}</strong>
                  <Badge tone={contact.doNotContact ? "red" : "neutral"}>{contact.emailStatus}</Badge>
                </div>
                <p className="mt-1 text-neutral-600">{contact.email ?? "Sin correo"} · {contact.phone ?? "Sin teléfono"}</p>
              </div>
            ))}
            {!establishment.contacts.length ? <p className="text-sm text-neutral-600">Sin contactos guardados.</p> : null}
          </div>
        </Card>
      </div>

      {organization ? (
        <Card>
          <h2 className="font-semibold">Registrar actividad</h2>
          <form action={addCommercialActivityAction} className="mt-4 grid gap-3 md:grid-cols-2">
            <input type="hidden" name="organizationId" value={organization.id} />
            <Field label="Contacto">
              <Select name="contactId">
                <option value="">Sin contacto específico</option>
                {establishment.contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>{contact.name ?? contact.email ?? contact.role}</option>
                ))}
              </Select>
            </Field>
            <Field label="Tipo">
              <Select name="type" defaultValue="NOTE">
                <option value="NOTE">Nota</option>
                <option value="CALL">Llamada</option>
                <option value="EMAIL_DRAFT">Correo preparado</option>
                <option value="MEETING">Reunión</option>
              </Select>
            </Field>
            <Field label="Asunto">
              <Input name="subject" />
            </Field>
            <Field label="Dirección">
              <Select name="direction" defaultValue="INTERNAL">
                <option value="INTERNAL">Interna</option>
                <option value="OUTBOUND">Saliente</option>
                <option value="INBOUND">Entrante</option>
              </Select>
            </Field>
            <div className="md:col-span-2">
              <Field label="Notas">
                <Textarea name="body" />
              </Field>
            </div>
            <Button type="submit" variant="secondary">Guardar actividad</Button>
          </form>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="font-semibold">Historial de scraping</h2>
          <div className="mt-3 grid gap-2 text-sm">
            {establishment.scrapeAttempts.map((attempt) => (
              <div key={attempt.id} className="rounded-md border border-[var(--brand-border)] p-2">
                <Badge tone={statusTone(attempt.status)}>{attempt.status}</Badge>
                <p className="mt-1 text-neutral-600">HTTP {attempt.httpStatus ?? "sin código"} · {formatDate(attempt.startedAt)}</p>
              </div>
            ))}
            {!establishment.scrapeAttempts.length ? <p className="text-neutral-600">Sin intentos registrados.</p> : null}
          </div>
        </Card>
        <Card>
          <h2 className="font-semibold">Cambios detectados</h2>
          <div className="mt-3 grid gap-2 text-sm">
            {establishment.changes.map((change) => (
              <div key={change.id} className="rounded-md border border-[var(--brand-border)] p-2">
                <strong>{formatDate(change.createdAt)}</strong>
                <p className="mt-1 text-neutral-600">{change.changedFields}</p>
              </div>
            ))}
            {!establishment.changes.length ? <p className="text-neutral-600">Sin cambios detectados.</p> : null}
          </div>
        </Card>
        <Card>
          <h2 className="font-semibold">Actividades y oportunidades</h2>
          <div className="mt-3 grid gap-2 text-sm">
            {organization?.opportunities.map((opportunity) => (
              <div key={opportunity.id} className="rounded-md border border-[var(--brand-border)] p-2">
                <Badge>{opportunity.stage.replaceAll("_", " ")}</Badge>
                <p className="mt-1 text-neutral-600">{opportunity.productInterest ?? "Sin producto definido"}</p>
              </div>
            ))}
            {organization?.activities.map((activity) => (
              <div key={activity.id} className="rounded-md border border-[var(--brand-border)] p-2">
                <strong>{activity.subject || activity.type}</strong>
                <p className="mt-1 text-neutral-600">{activity.body || "Sin detalle"} · {formatDate(activity.occurredAt)}</p>
              </div>
            ))}
            {!organization?.opportunities.length && !organization?.activities.length ? (
              <p className="text-neutral-600">Sin actividad comercial todavía.</p>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
