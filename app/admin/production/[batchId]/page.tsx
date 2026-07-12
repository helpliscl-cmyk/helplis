import Link from "next/link";
import { notFound } from "next/navigation";
import { BatchStatus } from "@prisma/client";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { generateProductionCodesAction, updateProductionBatchAction } from "@/features/production/actions";
import { formatDate } from "@/lib/formatting/format";
import { prisma } from "@/server/db/client";

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <p className="text-xs uppercase text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </Card>
  );
}

export default async function ProductionBatchDetailPage({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      devices: {
        select: {
          id: true,
          internalSequence: true,
          publicCode: true,
          publicUrl: true,
          nfcUid: true,
          productionStatus: true,
          verificationStatus: true,
          inventoryStatus: true,
        },
        orderBy: { internalSequence: "asc" },
        take: 20,
      },
      productionFiles: { orderBy: { generatedAt: "desc" }, take: 8 },
      supplierUidImports: { orderBy: { createdAt: "desc" }, take: 8 },
      physicalVerifications: { orderBy: { createdAt: "desc" }, take: 8 },
      _count: {
        select: {
          devices: true,
          productionFiles: true,
          supplierUidImports: true,
          physicalVerifications: true,
        },
      },
    },
  });

  if (!batch) notFound();

  const uidReceived = await prisma.device.count({
    where: { batchId: batch.id, nfcUid: { not: null } },
  });
  const verified = await prisma.device.count({
    where: { batchId: batch.id, verificationStatus: "FULLY_VERIFIED" },
  });
  const rejected = await prisma.device.count({
    where: {
      batchId: batch.id,
      verificationStatus: { in: ["DAMAGED", "REJECTED", "QR_MISMATCH", "NFC_MISMATCH", "UID_MISMATCH"] },
    },
  });
  const available = await prisma.device.count({
    where: { batchId: batch.id, inventoryStatus: "AVAILABLE" },
  });

  return (
    <div className="grid gap-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link className="text-sm text-[var(--brand-primary-dark)] underline-offset-4 hover:underline" href="/admin/production">
            Volver a produccion
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">{batch.internalReference}</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {batch.supplierName} · {batch.quantity} unidades · {batch.productType}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={batch.productionMode === "DEMO" ? "amber" : "blue"}>{batch.productionMode}</Badge>
          <Badge tone={statusTone(batch.status)}>{batch.status}</Badge>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Metric label="Codigos" value={`${batch._count.devices}/${batch.quantity}`} />
        <Metric label="Archivos" value={batch._count.productionFiles} />
        <Metric label="UID recibidos" value={uidReceived} />
        <Metric label="Verificadas" value={verified} />
        <Metric label="Rechazadas/error" value={rejected} />
        <Metric label="Disponibles" value={available} />
      </div>

      <Card className="grid gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Acciones de lote</h2>
            <p className="text-sm text-neutral-600">Genera codigos antes de cualquier archivo de proveedor.</p>
          </div>
          <form action={generateProductionCodesAction}>
            <input type="hidden" name="batchId" value={batch.id} />
            <Button type="submit" disabled={batch._count.devices > 0}>
              Generar codigos
            </Button>
          </form>
        </div>
        <div className="grid gap-2 sm:grid-cols-4">
          <Link className="rounded-md border border-neutral-300 px-3 py-2 text-center text-sm" href={`/admin/production/${batch.id}/export`}>
            Archivos proveedor
          </Link>
          <Link className="rounded-md border border-neutral-300 px-3 py-2 text-center text-sm" href={`/admin/production/${batch.id}/supplier-return`}>
            Importar UID
          </Link>
          <Link className="rounded-md border border-neutral-300 px-3 py-2 text-center text-sm" href={`/admin/production/${batch.id}/verification`}>
            Verificacion fisica
          </Link>
          <Link className="rounded-md border border-neutral-300 px-3 py-2 text-center text-sm" href={`/admin/inventory?batchId=${batch.id}`}>
            Inventario
          </Link>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Datos y progreso</h2>
        <form action={updateProductionBatchAction} className="grid gap-4">
          <input type="hidden" name="batchId" value={batch.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Proveedor">
              <Input name="supplierName" defaultValue={batch.supplierName} />
            </Field>
            <Field label="Contacto proveedor">
              <Input name="supplierContact" defaultValue={batch.supplierContact ?? ""} />
            </Field>
            <Field label="Referencia cotizacion">
              <Input name="supplierQuoteReference" defaultValue={batch.supplierQuoteReference ?? ""} />
            </Field>
            <Field label="Modelo">
              <Input name="productModel" defaultValue={batch.productModel ?? ""} />
            </Field>
            <Field label="Color">
              <Input name="color" defaultValue={batch.color ?? ""} />
            </Field>
            <Field label="Chip NFC">
              <Input name="chipType" defaultValue={batch.chipType ?? ""} />
            </Field>
            <Field label="Estado">
              <Select name="status" defaultValue={batch.status}>
                {Object.values(BatchStatus).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Notas">
            <Textarea name="notes" defaultValue={batch.notes ?? ""} />
          </Field>
          <Button type="submit" variant="secondary">
            Guardar cambios
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Fechas</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-neutral-500">Creado</dt>
            <dd>{formatDate(batch.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Enviado proveedor</dt>
            <dd>{formatDate(batch.sentToSupplierAt)}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Inicio produccion</dt>
            <dd>{formatDate(batch.productionStartedAt)}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Produccion completa</dt>
            <dd>{formatDate(batch.productionCompletedAt)}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Recibido</dt>
            <dd>{formatDate(batch.receivedAt)}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Verificado</dt>
            <dd>{formatDate(batch.verifiedAt)}</dd>
          </div>
        </dl>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-neutral-100 p-4">
          <h2 className="text-lg font-semibold">Primeras unidades</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[820px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Ref</th>
                <th className="px-4 py-3">Public code</th>
                <th className="px-4 py-3">URL</th>
                <th className="px-4 py-3">UID</th>
                <th className="px-4 py-3">Produccion</th>
                <th className="px-4 py-3">Verificacion</th>
                <th className="px-4 py-3">Inventario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {batch.devices.map((device) => (
                <tr key={device.id}>
                  <td className="px-4 py-3">{device.internalSequence ?? "-"}</td>
                  <td className="px-4 py-3 font-medium">{device.publicCode}</td>
                  <td className="px-4 py-3">{device.publicUrl}</td>
                  <td className="px-4 py-3">{device.nfcUid ?? "Pendiente"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(device.productionStatus)}>{device.productionStatus}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(device.verificationStatus)}>{device.verificationStatus}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(device.inventoryStatus)}>{device.inventoryStatus}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!batch.devices.length ? <p className="p-4 text-sm text-neutral-600">Genera codigos para ver unidades.</p> : null}
      </Card>
    </div>
  );
}
