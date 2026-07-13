import Link from "next/link";
import { Ban, Database, Pause, Play, RotateCw, Search, Square, TimerReset } from "lucide-react";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import {
  cancelMimeJobAction,
  createMimeSampleJobAction,
  createSingleRbdScrapeJobAction,
  deleteDemoMimeRecordsAction,
  pauseMimeJobAction,
  resumeMimeJobAction,
  runMimeJobAction,
} from "@/features/mime/actions";
import { formatDate } from "@/lib/formatting/format";
import { prisma } from "@/server/db/client";

export default async function AdminMimePage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string; error?: string }>;
}) {
  const params = await searchParams;
  const [
    total,
    withEmail,
    withPhone,
    withWebsite,
    processed,
    failedAttempts,
    contactable,
    excluded,
    regionDistribution,
    dependencyDistribution,
    commercialDistribution,
    demoCount,
    mimeRealCount,
    importedCount,
    jobs,
  ] = await Promise.all([
    prisma.establishment.count(),
    prisma.establishment.count({ where: { contactEmail: { not: null } } }),
    prisma.establishment.count({ where: { phone: { not: null } } }),
    prisma.establishment.count({ where: { website: { not: null } } }),
    prisma.establishment.count({ where: { sourceCheckedAt: { not: null } } }),
    prisma.scrapeAttempt.count({ where: { status: { in: ["FAILED", "BLOCKED", "NOT_FOUND"] } } }),
    prisma.organization.count({ where: { establishmentId: { not: null }, doNotContact: false, contactEmail: { not: null } } }),
    prisma.organization.count({ where: { establishmentId: { not: null }, doNotContact: true } }),
    prisma.establishment.groupBy({ by: ["region"], _count: { _all: true }, orderBy: { _count: { region: "desc" } }, take: 8 }),
    prisma.establishment.groupBy({
      by: ["dependency"],
      _count: { _all: true },
      orderBy: { _count: { dependency: "desc" } },
      take: 8,
    }),
    prisma.organization.groupBy({
      by: ["commercialStatus"],
      where: { establishmentId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { commercialStatus: "desc" } },
    }),
    prisma.establishment.count({ where: { source: "SEED_LOCAL_MIME_SAMPLE" } }),
    prisma.establishment.count({ where: { source: "MIME_MINEDUC" } }),
    prisma.establishment.count({ where: { source: "RBD_IMPORT" } }),
    prisma.scrapeJob.findMany({
      include: { attempts: { orderBy: { startedAt: "desc" }, take: 5 } },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const stats = [
    { label: "Establecimientos", value: total, Icon: Database },
    { label: "Con correo", value: withEmail, Icon: Search },
    { label: "Sin correo", value: total - withEmail, Icon: Ban },
    { label: "Con teléfono", value: withPhone, Icon: Search },
    { label: "Con web", value: withWebsite, Icon: Search },
    { label: "Procesados", value: processed, Icon: RotateCw },
    { label: "Pendientes", value: total - processed, Icon: TimerReset },
    { label: "Fallidos", value: failedAttempts, Icon: Ban },
    { label: "Contactables", value: contactable, Icon: Play },
    { label: "Excluidos", value: excluded, Icon: Square },
  ];

  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">MIME Mineduc y CRM HelPlis</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Scraping responsable, importación de RBD y prospección comercial sin envíos automáticos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="text-sm font-medium text-[var(--brand-primary-dark)] underline" href="/admin/mime/imports">
            Importar RBD
          </Link>
          <Link className="text-sm font-medium text-[var(--brand-primary-dark)] underline" href="/admin/mime/establishments">
            Ver establecimientos
          </Link>
          <Link className="text-sm font-medium text-[var(--brand-primary-dark)] underline" href="/admin/mime/pipeline">
            Pipeline
          </Link>
        </div>
      </header>

      {params.error ? <Badge tone="red">Error: {params.error}</Badge> : null}
      {demoCount ? (
        <Card className="border-amber-200 bg-amber-50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-amber-900">Hay registros DEMO visibles</h2>
              <p className="mt-1 text-sm text-amber-800">
                {demoCount} establecimientos provienen del seed local y no deben mezclarse con la validación real.
              </p>
            </div>
            <form action={deleteDemoMimeRecordsAction}>
              <Button type="submit" variant="danger">Borrar solo demos</Button>
            </form>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map(({ label, value, Icon }) => (
          <Card key={label}>
            <Icon aria-hidden className="mb-2 h-4 w-4 text-neutral-500" />
            <div className="text-2xl font-semibold">{Number(value).toLocaleString("es-CL")}</div>
            <div className="text-sm text-neutral-600">{label}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/admin/mime/establishments?sourceType=real" className="rounded-lg border border-[var(--brand-border)] bg-white p-4 hover:bg-[#edf8fb]">
          <div className="text-2xl font-semibold">{mimeRealCount.toLocaleString("es-CL")}</div>
          <div className="text-sm text-neutral-600">Registros MIME reales</div>
        </Link>
        <Link href="/admin/mime/establishments?sourceType=demo" className="rounded-lg border border-amber-200 bg-amber-50 p-4 hover:bg-amber-100">
          <div className="text-2xl font-semibold">{demoCount.toLocaleString("es-CL")}</div>
          <div className="text-sm text-amber-800">Registros demo</div>
        </Link>
        <Link href="/admin/mime/establishments?sourceType=imported" className="rounded-lg border border-[var(--brand-border)] bg-white p-4 hover:bg-[#edf8fb]">
          <div className="text-2xl font-semibold">{importedCount.toLocaleString("es-CL")}</div>
          <div className="text-sm text-neutral-600">Registros importados</div>
        </Link>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
        <Card>
          <h2 className="font-semibold">Distribución por región</h2>
          <div className="mt-3 grid gap-2 text-sm">
            {regionDistribution.map((item) => (
              <div key={item.region ?? "Sin región"} className="flex justify-between gap-3">
                <span>{item.region ?? "Sin región"}</span>
                <strong>{item._count._all.toLocaleString("es-CL")}</strong>
              </div>
            ))}
            {!regionDistribution.length ? <p className="text-neutral-600">Sin datos importados.</p> : null}
          </div>
        </Card>
        <Card>
          <h2 className="font-semibold">Distribución por dependencia</h2>
          <div className="mt-3 grid gap-2 text-sm">
            {dependencyDistribution.map((item) => (
              <div key={item.dependency ?? "Sin dependencia"} className="flex justify-between gap-3">
                <span>{item.dependency ?? "Sin dependencia"}</span>
                <strong>{item._count._all.toLocaleString("es-CL")}</strong>
              </div>
            ))}
            {!dependencyDistribution.length ? <p className="text-neutral-600">Sin datos importados.</p> : null}
          </div>
        </Card>
        <Card>
          <h2 className="font-semibold">Etapa comercial</h2>
          <div className="mt-3 grid gap-2 text-sm">
            {commercialDistribution.map((item) => (
              <div key={item.commercialStatus} className="flex justify-between gap-3">
                <span>{item.commercialStatus.replaceAll("_", " ")}</span>
                <strong>{item._count._all.toLocaleString("es-CL")}</strong>
              </div>
            ))}
            {!commercialDistribution.length ? <p className="text-neutral-600">Sin pipeline todavía.</p> : null}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Modo SAMPLE</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Crea un job de 5 a 20 RBD conocidos para revisar antes de guardar o ampliar el universo.
          </p>
          <form action={createMimeSampleJobAction} className="mt-4">
            <Button type="submit">
              <Play aria-hidden className="h-4 w-4" />
              Crear SAMPLE
            </Button>
          </form>
        </Card>
        <Card>
          <h2 className="font-semibold">Consultar un RBD</h2>
          <form action={createSingleRbdScrapeJobAction} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <Field label="RBD">
              <Input name="rbd" inputMode="numeric" placeholder="8927" />
            </Field>
            <Button type="submit" variant="secondary">
              <Search aria-hidden className="h-4 w-4" />
              Crear job
            </Button>
          </form>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-[var(--brand-border)] p-4">
          <h2 className="font-semibold">Jobs persistentes</h2>
          <p className="mt-1 text-sm text-neutral-600">La ejecución es manual; no se lanza scraping nacional en pruebas.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1080px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Progreso</th>
                <th className="px-4 py-3">Éxitos</th>
                <th className="px-4 py-3">Fallos</th>
                <th className="px-4 py-3">Heartbeat</th>
                <th className="px-4 py-3">Creado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {jobs.map((job) => (
                <tr key={job.id} className={params.job === job.id ? "bg-[#edf8fb]" : ""}>
                  <td className="px-4 py-3 font-medium">{job.type}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(job.status)}>{job.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {job.processedItems}/{job.totalItems}
                  </td>
                  <td className="px-4 py-3">{job.successfulItems}</td>
                  <td className="px-4 py-3">{job.failedItems}</td>
                  <td className="px-4 py-3">{formatDate(job.lastHeartbeatAt)}</td>
                  <td className="px-4 py-3">{formatDate(job.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <form action={runMimeJobAction}>
                        <input type="hidden" name="jobId" value={job.id} />
                        <Button type="submit" variant="secondary" className="min-h-9 px-3 py-1">
                          <Play aria-hidden className="h-4 w-4" />
                          Ejecutar
                        </Button>
                      </form>
                      <form action={pauseMimeJobAction}>
                        <input type="hidden" name="jobId" value={job.id} />
                        <Button type="submit" variant="ghost" className="min-h-9 px-3 py-1">
                          <Pause aria-hidden className="h-4 w-4" />
                          Pausar
                        </Button>
                      </form>
                      <form action={resumeMimeJobAction}>
                        <input type="hidden" name="jobId" value={job.id} />
                        <Button type="submit" variant="ghost" className="min-h-9 px-3 py-1">
                          <RotateCw aria-hidden className="h-4 w-4" />
                          Reanudar
                        </Button>
                      </form>
                      <form action={cancelMimeJobAction}>
                        <input type="hidden" name="jobId" value={job.id} />
                        <Button type="submit" variant="danger" className="min-h-9 px-3 py-1">
                          Cancelar
                        </Button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!jobs.length ? <p className="p-4 text-sm text-neutral-600">No hay jobs MIME todavía.</p> : null}
      </Card>
    </div>
  );
}
