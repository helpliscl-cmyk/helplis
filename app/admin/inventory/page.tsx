import Link from "next/link";
import { InventoryStatus } from "@prisma/client";
import { Badge, statusTone } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { formatDate } from "@/lib/formatting/format";
import { prisma } from "@/server/db/client";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; batchId?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim();
  const status = params.status && Object.values(InventoryStatus).includes(params.status as InventoryStatus) ? params.status : "";
  const batchId = params.batchId || "";
  const batches = await prisma.batch.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  const devices = await prisma.device.findMany({
    where: {
      ...(status ? { inventoryStatus: status as InventoryStatus } : {}),
      ...(batchId ? { batchId } : {}),
      ...(q
        ? {
            OR: [
              { publicCode: { contains: q } },
              { publicUrl: { contains: q } },
              { nfcUid: { contains: q.toUpperCase() } },
              { batch: { internalReference: { contains: q } } },
              { orderItems: { some: { order: { orderNumber: { contains: q } } } } },
            ],
          }
        : {}),
    },
    include: {
      batch: { select: { internalReference: true } },
      inventoryLocation: true,
      orderItems: { include: { order: { select: { orderNumber: true } } }, take: 1, orderBy: { createdAt: "desc" } },
    },
    orderBy: [{ inventoryStatus: "asc" }, { createdAt: "desc" }],
    take: 150,
  });

  return (
    <div className="grid gap-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Inventario</h1>
          <p className="mt-1 text-sm text-neutral-600">Busqueda por publicCode, UID, lote, pedido y estado operativo.</p>
        </div>
        <Link className="rounded-md border border-neutral-300 px-3 py-2 text-sm" href="/api/admin/inventory/export">
          Exportar CSV
        </Link>
      </header>

      <Card>
        <form className="grid gap-4 sm:grid-cols-[1fr_180px_220px_auto] sm:items-end">
          <Field label="Buscar">
            <Input name="q" defaultValue={q ?? ""} placeholder="publicCode, UID, lote o pedido" />
          </Field>
          <Field label="Estado">
            <Select name="status" defaultValue={status}>
              <option value="">Todos</option>
              {Object.values(InventoryStatus).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Lote">
            <Select name="batchId" defaultValue={batchId}>
              <option value="">Todos</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.internalReference}
                </option>
              ))}
            </Select>
          </Field>
          <button className="min-h-11 rounded-md border border-[var(--brand-primary-dark)] bg-[var(--brand-primary-dark)] px-4 py-2 text-sm font-medium text-white">
            Filtrar
          </button>
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-[1060px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Public code</th>
                <th className="px-4 py-3">UID</th>
                <th className="px-4 py-3">Lote</th>
                <th className="px-4 py-3">Pedido</th>
                <th className="px-4 py-3">Inventario</th>
                <th className="px-4 py-3">Verificacion</th>
                <th className="px-4 py-3">Ubicacion</th>
                <th className="px-4 py-3">Actualizado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {devices.map((device) => (
                <tr key={device.id} className="align-top">
                  <td className="px-4 py-3 font-medium">
                    <Link className="text-[var(--brand-primary-dark)] underline-offset-4 hover:underline" href={`/admin/inventory/${device.id}`}>
                      {device.publicCode}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{device.nfcUid ?? "Sin UID"}</td>
                  <td className="px-4 py-3">{device.batch?.internalReference ?? "Sin lote"}</td>
                  <td className="px-4 py-3">{device.orderItems[0]?.order.orderNumber ?? "Sin pedido"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(device.inventoryStatus)}>{device.inventoryStatus}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(device.verificationStatus)}>{device.verificationStatus}</Badge>
                  </td>
                  <td className="px-4 py-3">{device.inventoryLocation?.name ?? "Sin ubicacion"}</td>
                  <td className="px-4 py-3">{formatDate(device.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!devices.length ? <p className="p-4 text-sm text-neutral-600">No hay resultados para los filtros.</p> : null}
      </Card>
    </div>
  );
}
