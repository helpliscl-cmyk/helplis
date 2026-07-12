import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Select } from "@/components/ui/field";
import { generateManufacturerExportAction } from "@/features/production/actions";
import { formatDate } from "@/lib/formatting/format";
import { prisma } from "@/server/db/client";

export default async function ManufacturerExportPage({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      productionFiles: { orderBy: { generatedAt: "desc" } },
      _count: { select: { devices: true } },
    },
  });
  if (!batch) notFound();

  return (
    <div className="grid gap-5">
      <header>
        <Link className="text-sm text-[var(--brand-primary-dark)] underline-offset-4 hover:underline" href={`/admin/production/${batch.id}`}>
          Volver al lote
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Archivos para proveedor</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {batch.internalReference} · {batch._count.devices} codigos generados · sin activationCode.
        </p>
      </header>

      <Card className="border-amber-200 bg-amber-50">
        <p className="text-sm font-medium text-amber-900">
          El paquete estandar solo incluye publicCode, URL, QR y NFC. El codigo secreto de activacion no viaja al proveedor.
        </p>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Generar paquete</h2>
        <form action={generateManufacturerExportAction} className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <input type="hidden" name="batchId" value={batch.id} />
          <Field label="Formato">
            <Select name="format" defaultValue="FULL_PACKAGE">
              <option value="URLS_ONLY">A. URLs solamente</option>
              <option value="CSV">B. CSV + URLs</option>
              <option value="XLSX">C. XLSX + URLs</option>
              <option value="QR_PNG_ZIP">D. URLs + QR PNG</option>
              <option value="QR_SVG_ZIP">E. URLs + QR SVG</option>
              <option value="FULL_PACKAGE">F. Paquete completo</option>
            </Select>
          </Field>
          <Button type="submit" disabled={batch._count.devices === 0}>
            Generar
          </Button>
        </form>
        {batch._count.devices === 0 ? (
          <p className="mt-3 text-sm text-red-700">Primero genera codigos en el detalle del lote.</p>
        ) : null}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-neutral-100 p-4">
          <h2 className="text-lg font-semibold">Historial de archivos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[860px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Archivo</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Checksum</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Generado</th>
                <th className="px-4 py-3">Descarga</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {batch.productionFiles.map((file) => (
                <tr key={file.id}>
                  <td className="px-4 py-3 font-medium">{file.filename}</td>
                  <td className="px-4 py-3">{file.type}</td>
                  <td className="px-4 py-3 font-mono text-xs">{file.checksum.slice(0, 16)}...</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(file.status)}>{file.status}</Badge>
                  </td>
                  <td className="px-4 py-3">{formatDate(file.generatedAt)}</td>
                  <td className="px-4 py-3">
                    <Link className="text-[var(--brand-primary-dark)] underline-offset-4 hover:underline" href={`/api/admin/production-files/${file.id}`}>
                      Descargar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!batch.productionFiles.length ? <p className="p-4 text-sm text-neutral-600">No hay archivos generados.</p> : null}
      </Card>
    </div>
  );
}
