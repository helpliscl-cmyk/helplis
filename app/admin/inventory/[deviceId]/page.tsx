import Link from "next/link";
import { notFound } from "next/navigation";
import { InventoryStatus } from "@prisma/client";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { quickInventoryAction, updateInventoryDeviceAction } from "@/features/inventory/actions";
import { formatDate } from "@/lib/formatting/format";
import { prisma } from "@/server/db/client";

export default async function InventoryDevicePage({ params }: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = await params;
  const device = await prisma.device.findUnique({
    where: { id: deviceId },
    include: {
      batch: true,
      inventoryLocation: true,
      orderItems: { include: { order: true }, orderBy: { createdAt: "desc" } },
      physicalVerifications: { orderBy: { createdAt: "desc" }, take: 8 },
    },
  });
  if (!device) notFound();
  const audits = await prisma.auditLog.findMany({
    where: { entityType: "Device", entityId: device.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="grid gap-5">
      <header>
        <Link className="text-sm text-[var(--brand-primary-dark)] underline-offset-4 hover:underline" href="/admin/inventory">
          Volver a inventario
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{device.publicCode}</h1>
        <p className="mt-1 text-sm text-neutral-600">{device.publicUrl}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-4">
        <Card>
          <p className="text-xs uppercase text-neutral-500">Inventario</p>
          <Badge className="mt-2" tone={statusTone(device.inventoryStatus)}>{device.inventoryStatus}</Badge>
        </Card>
        <Card>
          <p className="text-xs uppercase text-neutral-500">Verificacion</p>
          <Badge className="mt-2" tone={statusTone(device.verificationStatus)}>{device.verificationStatus}</Badge>
        </Card>
        <Card>
          <p className="text-xs uppercase text-neutral-500">Lote</p>
          <p className="mt-2 font-medium">{device.batch?.internalReference ?? "Sin lote"}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-neutral-500">Pedido</p>
          <p className="mt-2 font-medium">{device.orderItems[0]?.order.orderNumber ?? "Sin pedido"}</p>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Acciones rapidas</h2>
        <div className="flex flex-wrap gap-2">
          {[
            ["reserve", "Reservar"],
            ["release", "Liberar"],
            ["damage", "Marcar danada"],
          ].map(([action, label]) => (
            <form key={action} action={quickInventoryAction}>
              <input type="hidden" name="deviceId" value={device.id} />
              <input type="hidden" name="action" value={action} />
              <Button type="submit" variant={action === "damage" ? "danger" : "secondary"}>
                {label}
              </Button>
            </form>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Mover o actualizar</h2>
        <form action={updateInventoryDeviceAction} className="grid gap-4">
          <input type="hidden" name="deviceId" value={device.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Estado inventario">
              <Select name="inventoryStatus" defaultValue={device.inventoryStatus}>
                {Object.values(InventoryStatus).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Nombre ubicacion">
              <Input name="locationName" defaultValue={device.inventoryLocation?.name ?? ""} placeholder="Bodega principal" />
            </Field>
            <Field label="Warehouse">
              <Input name="warehouse" defaultValue={device.inventoryLocation?.warehouse ?? ""} />
            </Field>
            <Field label="Shelf">
              <Input name="shelf" defaultValue={device.inventoryLocation?.shelf ?? ""} />
            </Field>
            <Field label="Box">
              <Input name="box" defaultValue={device.inventoryLocation?.box ?? ""} />
            </Field>
            <Field label="Position">
              <Input name="position" defaultValue={device.inventoryLocation?.position ?? ""} />
            </Field>
          </div>
          <Field label="Notas">
            <Textarea name="notes" />
          </Field>
          <Button type="submit">Guardar inventario</Button>
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-neutral-100 p-4">
          <h2 className="text-lg font-semibold">Historial</h2>
        </div>
        <div className="grid gap-0 divide-y divide-neutral-100">
          {[...device.physicalVerifications.map((item) => ({
            id: item.id,
            title: `Verificacion ${item.overallStatus}`,
            detail: item.notes ?? item.qrStatus,
            date: item.createdAt,
          })), ...audits.map((item) => ({
            id: item.id,
            title: item.action,
            detail: item.newData ?? "",
            date: item.createdAt,
          }))].map((item) => (
            <div key={item.id} className="p-4 text-sm">
              <p className="font-medium">{item.title}</p>
              <p className="mt-1 text-neutral-600">{item.detail}</p>
              <p className="mt-1 text-xs text-neutral-500">{formatDate(item.date)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
