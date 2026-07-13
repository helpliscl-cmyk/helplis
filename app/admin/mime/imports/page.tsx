import Link from "next/link";
import { CheckCircle2, FileSpreadsheet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { confirmRbdImportAction, previewRbdImportAction } from "@/features/mime/actions";
import { formatDate } from "@/lib/formatting/format";
import { prisma } from "@/server/db/client";
import type { RbdImportPreview } from "@/server/mime/importer";

function parsePreview(configuration: string) {
  try {
    return JSON.parse(configuration) as { filename?: string; preview?: RbdImportPreview; importResult?: unknown };
  } catch {
    return {};
  }
}

export default async function AdminMimeImportsPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string; imported?: string; error?: string }>;
}) {
  const params = await searchParams;
  const previewJobId = params.preview ?? params.imported;
  const [previewJob, recentJobs] = await Promise.all([
    previewJobId ? prisma.scrapeJob.findUnique({ where: { id: previewJobId } }) : null,
    prisma.scrapeJob.findMany({
      where: { type: "IMPORTED_RBDS" },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);
  const previewConfig = previewJob ? parsePreview(previewJob.configuration) : {};
  const preview = previewConfig.preview;

  const exampleCsv = [
    "RBD,Nombre,Región,Comuna,Dependencia,Estado",
    "8927,Liceo Carmela Carvajal de Prat,Región Metropolitana,Providencia,Municipal,Funcionando",
    "10686,Colegio Gabriela Mistral,Región de Valparaíso,Calera,Particular subvencionado,Funcionando",
  ].join("\n");

  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Importar universo RBD</h1>
          <p className="mt-1 text-sm text-neutral-600">
            CSV/XLSX con vista previa antes de confirmar. La importación es idempotente por RBD.
          </p>
        </div>
        <Link className="text-sm font-medium text-[var(--brand-primary-dark)] underline" href="/admin/mime">
          Volver a MIME
        </Link>
      </header>

      {params.error ? <Badge tone="red">{params.error}</Badge> : null}

      <Card>
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <FileSpreadsheet aria-hidden className="h-4 w-4" />
          Generar vista previa
        </h2>
        <form action={previewRbdImportAction} className="grid gap-4">
          <Field label="Archivo CSV o XLSX" hint="Debe incluir al menos una columna RBD. Las demás columnas enriquecen sin borrar datos MIME.">
            <Input name="file" type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />
          </Field>
          <Field label="CSV manual">
            <Textarea name="csv" defaultValue={exampleCsv} />
          </Field>
          <Button type="submit">Vista previa</Button>
        </form>
      </Card>

      {previewJob && preview ? (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-[var(--brand-border)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">Preview: {previewConfig.filename ?? "archivo"}</h2>
                <p className="mt-1 text-sm text-neutral-600">
                  {preview.totalRows} filas · {preview.newRows} nuevas · {preview.updatedRows} actualizadas ·{" "}
                  {preview.errorRows} con errores
                </p>
              </div>
              {previewJob.status === "DRAFT" ? (
                <form action={confirmRbdImportAction}>
                  <input type="hidden" name="jobId" value={previewJob.id} />
                  <Button type="submit">
                    <CheckCircle2 aria-hidden className="h-4 w-4" />
                    Confirmar importación
                  </Button>
                </form>
              ) : (
                <Badge tone="green">Importación procesada</Badge>
              )}
            </div>
            {preview.columnErrors.length ? (
              <div className="mt-3 grid gap-1 text-sm text-red-700">
                {preview.columnErrors.map((error) => (
                  <span key={error}>{error}</span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[980px] text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Fila</th>
                  <th className="px-4 py-3">Acción</th>
                  <th className="px-4 py-3">RBD</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Región</th>
                  <th className="px-4 py-3">Comuna</th>
                  <th className="px-4 py-3">Dependencia</th>
                  <th className="px-4 py-3">Errores</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {preview.rows.slice(0, 100).map((row) => (
                  <tr key={`${row.rowNumber}-${row.rbd ?? "sin-rbd"}`}>
                    <td className="px-4 py-3">{row.rowNumber}</td>
                    <td className="px-4 py-3">
                      <Badge tone={row.action === "error" ? "red" : row.action === "new" ? "green" : "blue"}>
                        {row.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{row.rbd ?? "Sin RBD"}</td>
                    <td className="px-4 py-3">{row.name ?? "Sin nombre"}</td>
                    <td className="px-4 py-3">{row.region ?? "Sin región"}</td>
                    <td className="px-4 py-3">{row.commune ?? "Sin comuna"}</td>
                    <td className="px-4 py-3">{row.dependency ?? "Sin dependencia"}</td>
                    <td className="px-4 py-3">{row.errors.join(", ") || "Sin errores"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      <Card>
        <h2 className="font-semibold">Importaciones recientes</h2>
        <div className="mt-3 grid gap-2">
          {recentJobs.map((job) => (
            <Link
              key={job.id}
              href={`/admin/mime/imports?preview=${job.id}`}
              className="rounded-md border border-[var(--brand-border)] p-3 text-sm hover:bg-[#edf8fb]"
            >
              <strong>{job.status}</strong> · {job.totalItems} filas · {formatDate(job.createdAt)}
            </Link>
          ))}
          {!recentJobs.length ? <p className="text-sm text-neutral-600">Todavía no hay importaciones RBD.</p> : null}
        </div>
      </Card>
    </div>
  );
}
