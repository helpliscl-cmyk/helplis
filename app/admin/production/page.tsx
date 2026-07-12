import Link from "next/link";
import { Badge, statusTone } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/formatting/format";
import { prisma } from "@/server/db/client";

export default async function AdminProductionPage() {
  const batches = await prisma.batch.findMany({
    include: {
      _count: {
        select: {
          devices: true,
          productionFiles: true,
          supplierUidImports: true,
          physicalVerifications: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const totals = {
    draft: batches.filter((batch) => batch.status === "DRAFT").length,
    codes: batches.reduce((sum, batch) => sum + batch._count.devices, 0),
    files: batches.reduce((sum, batch) => sum + batch._count.productionFiles, 0),
    uidImports: batches.reduce((sum, batch) => sum + batch._count.supplierUidImports, 0),
  };

  return (
    <div className="grid gap-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Produccion</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Lotes operativos, codigos, proveedor, UID, verificacion e inventario inicial.
          </p>
        </div>
        <ButtonLink href="/admin/production/new">Nuevo lote</ButtonLink>
      </header>

      <Card className="border-amber-200 bg-amber-50">
        <p className="text-sm font-medium text-amber-900">
          Los lotes DEMO o SAMPLE no son el lote real de 500 unidades. No se deben enviar archivos al proveedor desde
          esta pantalla hasta aprobar manualmente el paquete.
        </p>
      </Card>

      <div className="grid gap-3 sm:grid-cols-4">
        <Card>
          <p className="text-xs uppercase text-neutral-500">Borradores</p>
          <p className="mt-1 text-2xl font-semibold">{totals.draft}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-neutral-500">Codigos generados</p>
          <p className="mt-1 text-2xl font-semibold">{totals.codes}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-neutral-500">Archivos</p>
          <p className="mt-1 text-2xl font-semibold">{totals.files}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-neutral-500">Importaciones UID</p>
          <p className="mt-1 text-2xl font-semibold">{totals.uidImports}</p>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Referencia</th>
                <th className="px-4 py-3">Modo</th>
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3">Cantidad</th>
                <th className="px-4 py-3">Codigos</th>
                <th className="px-4 py-3">Archivos</th>
                <th className="px-4 py-3">UID</th>
                <th className="px-4 py-3">Verificaciones</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Creado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {batches.map((batch) => (
                <tr key={batch.id} className="align-top">
                  <td className="px-4 py-3 font-medium">
                    <Link
                      className="text-[var(--brand-primary-dark)] underline-offset-4 hover:underline"
                      href={`/admin/production/${batch.id}`}
                    >
                      {batch.internalReference}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={batch.productionMode === "DEMO" ? "amber" : "blue"}>{batch.productionMode}</Badge>
                  </td>
                  <td className="px-4 py-3">{batch.supplierName}</td>
                  <td className="px-4 py-3">{batch.quantity}</td>
                  <td className="px-4 py-3">{batch._count.devices}</td>
                  <td className="px-4 py-3">{batch._count.productionFiles}</td>
                  <td className="px-4 py-3">{batch._count.supplierUidImports}</td>
                  <td className="px-4 py-3">{batch._count.physicalVerifications}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(batch.status)}>{batch.status}</Badge>
                  </td>
                  <td className="px-4 py-3">{formatDate(batch.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!batches.length ? <p className="p-4 text-sm text-neutral-600">Todavia no hay lotes operativos.</p> : null}
      </Card>
    </div>
  );
}
