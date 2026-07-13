import Link from "next/link";
import { ExternalLink, Search } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { updateCommercialStatusAction } from "@/features/mime/actions";
import { formatDate } from "@/lib/formatting/format";
import { parseRbd } from "@/server/mime/normalization";
import { prisma } from "@/server/db/client";

const COMMERCIAL_STAGES = [
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

function sourceWhere(sourceType?: string): Prisma.EstablishmentWhereInput | null {
  if (sourceType === "demo") return { source: "SEED_LOCAL_MIME_SAMPLE" };
  if (sourceType === "real") return { source: "MIME_MINEDUC" };
  if (sourceType === "imported") return { source: "RBD_IMPORT" };
  return null;
}

function sourceLabel(source: string) {
  if (source === "SEED_LOCAL_MIME_SAMPLE") return { label: "DEMO", tone: "amber" as const };
  if (source === "MIME_MINEDUC") return { label: "MIME real", tone: "green" as const };
  if (source === "RBD_IMPORT") return { label: "Importado", tone: "blue" as const };
  return { label: source, tone: "neutral" as const };
}

function buildWhere(params: {
  q?: string;
  region?: string;
  dependency?: string;
  status?: string;
  level?: string;
  minEnrollment?: string;
  sourceType?: string;
}) {
  const where: Prisma.EstablishmentWhereInput = {};
  const and: Prisma.EstablishmentWhereInput[] = [];
  const q = params.q?.trim();
  if (q) {
    const rbd = parseRbd(q);
    and.push({
      OR: [
        rbd ? { rbd } : undefined,
        { name: { contains: q } },
        { commune: { contains: q } },
        { holderName: { contains: q } },
        { contactEmail: { contains: q.toLowerCase() } },
        { website: { contains: q.toLowerCase() } },
      ].filter(Boolean) as Prisma.EstablishmentWhereInput[],
    });
  }
  if (params.region) and.push({ region: params.region });
  if (params.dependency) and.push({ dependency: params.dependency });
  if (params.status) and.push({ status: params.status });
  if (params.level) and.push({ educationLevels: { contains: params.level } });
  const sourceFilter = sourceWhere(params.sourceType);
  if (sourceFilter) and.push(sourceFilter);
  const minEnrollment = Number(params.minEnrollment ?? 0);
  if (minEnrollment > 0) and.push({ totalEnrollment: { gte: minEnrollment } });
  if (and.length) where.AND = and;
  return where;
}

export default async function AdminMimeEstablishmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    region?: string;
    dependency?: string;
    status?: string;
    level?: string;
    minEnrollment?: string;
    sourceType?: string;
  }>;
}) {
  const params = await searchParams;
  const where = buildWhere(params);
  const [establishments, regions, dependencies, statuses] = await Promise.all([
    prisma.establishment.findMany({
      where,
      include: {
        holder: true,
        commercialOrganizations: { take: 1 },
        scrapeAttempts: { orderBy: { startedAt: "desc" }, take: 1 },
      },
      orderBy: [{ sourceCheckedAt: "desc" }, { updatedAt: "desc" }],
      take: 150,
    }),
    prisma.establishment.findMany({ distinct: ["region"], select: { region: true }, orderBy: { region: "asc" } }),
    prisma.establishment.findMany({ distinct: ["dependency"], select: { dependency: true }, orderBy: { dependency: "asc" } }),
    prisma.establishment.findMany({ distinct: ["status"], select: { status: true }, orderBy: { status: "asc" } }),
  ]);

  const queryString = new URLSearchParams(
    Object.entries(params).flatMap(([key, value]) => (value ? [[key, value]] : [])),
  ).toString();

  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Establecimientos</h1>
          <p className="mt-1 text-sm text-neutral-600">Base RBD nacional enriquecible con MIME.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="text-sm font-medium text-[var(--brand-primary-dark)] underline" href="/admin/mime">
            Jobs
          </Link>
          <Link
            className="text-sm font-medium text-[var(--brand-primary-dark)] underline"
            href={`/api/admin/mime/establishments/export${queryString ? `?${queryString}` : ""}`}
          >
            Exportar CSV
          </Link>
        </div>
      </header>

      <Card>
        <form className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Field label="Búsqueda">
            <Input name="q" defaultValue={params.q ?? ""} placeholder="Nombre, RBD, comuna, correo" />
          </Field>
          <Field label="Región">
            <Select name="region" defaultValue={params.region ?? ""}>
              <option value="">Todas</option>
              {regions.flatMap((item) =>
                item.region ? [<option key={item.region} value={item.region}>{item.region}</option>] : [],
              )}
            </Select>
          </Field>
          <Field label="Dependencia">
            <Select name="dependency" defaultValue={params.dependency ?? ""}>
              <option value="">Todas</option>
              {dependencies.flatMap((item) =>
                item.dependency ? [<option key={item.dependency} value={item.dependency}>{item.dependency}</option>] : [],
              )}
            </Select>
          </Field>
          <Field label="Estado">
            <Select name="status" defaultValue={params.status ?? ""}>
              <option value="">Todos</option>
              {statuses.flatMap((item) => (item.status ? [<option key={item.status} value={item.status}>{item.status}</option>] : []))}
            </Select>
          </Field>
          <Field label="Nivel">
            <Input name="level" defaultValue={params.level ?? ""} placeholder="Básica" />
          </Field>
          <Field label="Matrícula mínima">
            <Input name="minEnrollment" type="number" min="0" defaultValue={params.minEnrollment ?? ""} />
          </Field>
          <Field label="Origen">
            <Select name="sourceType" defaultValue={params.sourceType ?? ""}>
              <option value="">Todos</option>
              <option value="real">MIME real</option>
              <option value="demo">Demo seed</option>
              <option value="imported">Importado</option>
            </Select>
          </Field>
          <div className="md:col-span-3 xl:col-span-6">
            <Button type="submit" variant="secondary">
              <Search aria-hidden className="h-4 w-4" />
              Filtrar
            </Button>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-[1440px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3"><span className="sr-only">Seleccionar</span></th>
                <th className="px-4 py-3">RBD</th>
                <th className="px-4 py-3">Origen</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Comuna</th>
                <th className="px-4 py-3">Región</th>
                <th className="px-4 py-3">Dependencia</th>
                <th className="px-4 py-3">Matrícula</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Sostenedor</th>
                <th className="px-4 py-3">Etapa</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Scraping</th>
                <th className="px-4 py-3">Última actualización</th>
                <th className="px-4 py-3">MIME</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {establishments.map((establishment) => {
                const organization = establishment.commercialOrganizations[0];
                const source = sourceLabel(establishment.source);
                const latestAttempt = establishment.scrapeAttempts[0];
                return (
                  <tr key={establishment.id} className="align-top">
                    <td className="px-4 py-3">
                      <input aria-label={`Seleccionar RBD ${establishment.rbd}`} type="checkbox" />
                    </td>
                    <td className="px-4 py-3 font-medium">{establishment.rbd}</td>
                    <td className="px-4 py-3">
                      <Badge tone={source.tone}>{source.label}</Badge>
                      {establishment.source === "SEED_LOCAL_MIME_SAMPLE" ? (
                        <div className="mt-1 text-xs text-amber-700">Registro de muestra local</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <Link className="font-medium text-[var(--brand-primary-dark)] underline" href={`/admin/mime/establishments/${establishment.id}`}>
                        {establishment.name ?? "Sin nombre"}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{establishment.commune ?? "Sin comuna"}</td>
                    <td className="px-4 py-3">{establishment.region ?? "Sin región"}</td>
                    <td className="px-4 py-3">{establishment.dependency ?? "Sin dependencia"}</td>
                    <td className="px-4 py-3">{establishment.totalEnrollment?.toLocaleString("es-CL") ?? "Sin dato"}</td>
                    <td className="px-4 py-3">{establishment.contactEmail ?? "Sin correo"}</td>
                    <td className="px-4 py-3">{establishment.phone ?? "Sin teléfono"}</td>
                    <td className="px-4 py-3">{establishment.holder?.originalName ?? establishment.holderName ?? "Sin sostenedor"}</td>
                    <td className="px-4 py-3">
                      {organization ? (
                        <form action={updateCommercialStatusAction}>
                          <input type="hidden" name="organizationId" value={organization.id} />
                          <Select name="commercialStatus" defaultValue={organization.commercialStatus} className="min-h-9 text-sm">
                            {COMMERCIAL_STAGES.map((stage) => (
                              <option key={stage} value={stage}>{stage.replaceAll("_", " ")}</option>
                            ))}
                          </Select>
                          <Button type="submit" variant="ghost" className="mt-2 min-h-8 px-2 py-1 text-xs">
                            Guardar
                          </Button>
                        </form>
                      ) : (
                        <Badge>Sin revisar</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">{organization?.prospectScore ?? 0}</td>
                    <td className="px-4 py-3">
                      {latestAttempt ? <Badge tone={statusTone(latestAttempt.status)}>{latestAttempt.status}</Badge> : "Sin intento"}
                    </td>
                    <td className="px-4 py-3">{formatDate(establishment.sourceCheckedAt)}</td>
                    <td className="px-4 py-3">
                      <a className="inline-flex items-center gap-1 text-[var(--brand-primary-dark)] underline" href={establishment.mimeUrl} target="_blank" rel="noreferrer">
                        Ver ficha original en MIME
                        <ExternalLink aria-hidden className="h-3 w-3" />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!establishments.length ? <p className="p-4 text-sm text-neutral-600">No hay establecimientos para los filtros seleccionados.</p> : null}
      </Card>
    </div>
  );
}
