import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { createBatchAction } from "@/features/admin/actions";
import { prisma } from "@/server/db/client";

export default async function AdminBatchesPage() {
  const batches = await prisma.batch.findMany({
    include: { _count: { select: { devices: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Lotes</h1>
        <p className="mt-1 text-sm text-neutral-600">Generación local de dispositivos para fabricante/importación.</p>
      </header>
      <Card>
        <h2 className="mb-4 text-lg font-semibold">Crear y generar lote</h2>
        <form action={createBatchAction} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Proveedor">
              <Input name="supplierName" required defaultValue="Proveedor demo" />
            </Field>
            <Field label="Referencia interna">
              <Input name="internalReference" placeholder="Se genera automáticamente si queda vacío" />
            </Field>
            <Field label="Referencia proveedor">
              <Input name="supplierReference" />
            </Field>
            <Field label="Cantidad">
              <Input name="quantity" type="number" min={1} max={200} required defaultValue={5} />
            </Field>
            <Field label="Tipo producto">
              <Select name="productType" defaultValue="WRISTBAND">
                {["WRISTBAND", "PET_TAG", "KEYCHAIN", "CARD", "STICKER", "LUGGAGE_TAG", "ASSET_TAG", "OTHER"].map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Notas">
            <Textarea name="notes" />
          </Field>
          <Button type="submit">Crear lote y dispositivos</Button>
        </form>
      </Card>
      <div className="grid gap-3">
        {batches.map((batch) => (
          <Card key={batch.id} className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <div>
              <h2 className="font-semibold">{batch.internalReference}</h2>
              <p className="text-sm text-neutral-600">{batch.supplierName} · {batch._count.devices} dispositivos</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={statusTone(batch.status)}>{batch.status}</Badge>
              <a className="rounded-md border border-neutral-300 px-3 py-2 text-sm" href={`/api/admin/export/batch?batchId=${batch.id}`}>
                Exportar CSV
              </a>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
