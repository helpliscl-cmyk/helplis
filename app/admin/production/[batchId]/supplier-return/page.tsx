import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckboxField, Field, Input, Textarea } from "@/components/ui/field";
import { importSupplierUidReturnAction } from "@/features/production/actions";
import { formatDate } from "@/lib/formatting/format";
import { prisma } from "@/server/db/client";
import type { SupplierReturnPreviewRow } from "@/server/operations/supplier-uid-import";

function parsePreview(value: string | null): SupplierReturnPreviewRow[] {
  if (!value) return [];
  try {
    return JSON.parse(value) as SupplierReturnPreviewRow[];
  } catch {
    return [];
  }
}

export default async function SupplierReturnPage({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      supplierUidImports: { orderBy: { createdAt: "desc" }, take: 10 },
      _count: { select: { devices: true } },
    },
  });
  if (!batch) notFound();

  const latestPreview = parsePreview(batch.supplierUidImports[0]?.preview ?? null);
  const uidReceived = await prisma.device.count({ where: { batchId: batch.id, nfcUid: { not: null } } });

  return (
    <div className="grid gap-5">
      <header>
        <Link className="text-sm text-[var(--brand-primary-dark)] underline-offset-4 hover:underline" href={`/admin/production/${batch.id}`}>
          Volver al lote
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Importacion UID proveedor</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {batch.internalReference} · {uidReceived}/{batch._count.devices} UID recibidos.
        </p>
      </header>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Cargar retorno</h2>
        <form action={importSupplierUidReturnAction} className="grid gap-4">
          <input type="hidden" name="batchId" value={batch.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Archivo CSV/XLSX">
              <Input name="file" type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />
            </Field>
            <Field label="Nombre si pegas CSV">
              <Input name="filename" defaultValue="supplier-return.csv" />
            </Field>
          </div>
          <Field label="CSV pegado">
            <Textarea
              name="csv"
              placeholder="public_code,public_url,nfc_uid,qr_result,nfc_result,wristband_reference,batch_reference,notes"
            />
          </Field>
          <CheckboxField name="dryRun" label="Modo simulacion: validar y guardar preview sin actualizar UID." defaultChecked />
          <Button type="submit">Validar o importar</Button>
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-neutral-100 p-4">
          <h2 className="text-lg font-semibold">Historial</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[900px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Archivo</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Filas</th>
                <th className="px-4 py-3">Validas</th>
                <th className="px-4 py-3">Invalidas</th>
                <th className="px-4 py-3">Duplicadas</th>
                <th className="px-4 py-3">Importadas</th>
                <th className="px-4 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {batch.supplierUidImports.map((job) => (
                <tr key={job.id}>
                  <td className="px-4 py-3 font-medium">{job.filename}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(job.status)}>{job.status}</Badge>
                  </td>
                  <td className="px-4 py-3">{job.totalRows}</td>
                  <td className="px-4 py-3">{job.validRows}</td>
                  <td className="px-4 py-3">{job.invalidRows}</td>
                  <td className="px-4 py-3">{job.duplicateRows}</td>
                  <td className="px-4 py-3">{job.importedRows}</td>
                  <td className="px-4 py-3">{formatDate(job.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!batch.supplierUidImports.length ? <p className="p-4 text-sm text-neutral-600">Aun no hay importaciones UID.</p> : null}
      </Card>

      {latestPreview.length ? (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-neutral-100 p-4">
            <h2 className="text-lg font-semibold">Ultimo preview</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[960px] text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Fila</th>
                  <th className="px-4 py-3">Public code</th>
                  <th className="px-4 py-3">UID</th>
                  <th className="px-4 py-3">Errores</th>
                  <th className="px-4 py-3">Advertencias</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {latestPreview.slice(0, 25).map((row) => (
                  <tr key={`${row.rowNumber}-${row.public_code ?? row.public_url ?? row.nfc_uid}`}>
                    <td className="px-4 py-3">{row.rowNumber}</td>
                    <td className="px-4 py-3">{row.public_code ?? "Sin codigo"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{row.nfc_uid || "Sin UID"}</td>
                    <td className="px-4 py-3 text-red-700">{row.errors.join("; ") || "-"}</td>
                    <td className="px-4 py-3 text-amber-700">{row.warnings.join("; ") || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
