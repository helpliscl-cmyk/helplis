import Link from "next/link";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { updateAdminDeviceStatusAction } from "@/features/admin/actions";
import { prisma } from "@/server/db/client";

export default async function AdminDevicesPage() {
  const devices = await prisma.device.findMany({
    include: { owner: true, profile: true, batch: true, organization: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Dispositivos</h1>
        <p className="mt-1 text-sm text-neutral-600">No se expone UID NFC como autenticador ni activationCode.</p>
      </header>
      <div className="grid gap-3">
        {devices.map((device) => (
          <Card key={device.id} className="grid gap-2 lg:grid-cols-[1fr_auto]">
            <div>
              <h2 className="font-semibold">{device.publicCode}</h2>
              <p className="text-sm text-neutral-600">
                {device.productType} · {device.profile?.displayName ?? "Sin perfil"} · {device.owner?.email ?? "Sin propietario"}
              </p>
              <p className="text-xs text-neutral-500">{device.batch?.internalReference ?? "Sin lote"} · {device.organization?.name ?? "Sin organización"}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={statusTone(device.status)}>{device.status}</Badge>
              <Link href={`/p/${device.publicCode}`} className="rounded-md border border-neutral-300 px-3 py-2 text-sm">Ficha</Link>
              <form action={updateAdminDeviceStatusAction}>
                <input type="hidden" name="deviceId" value={device.id} />
                <input type="hidden" name="status" value="SUSPENDED" />
                <Button type="submit" variant="secondary">Suspender</Button>
              </form>
              <form action={updateAdminDeviceStatusAction}>
                <input type="hidden" name="deviceId" value={device.id} />
                <input type="hidden" name="status" value="ACTIVATED" />
                <Button type="submit" variant="secondary">Reactivar</Button>
              </form>
              <form action={updateAdminDeviceStatusAction}>
                <input type="hidden" name="deviceId" value={device.id} />
                <input type="hidden" name="status" value="DEACTIVATED" />
                <Button type="submit" variant="danger">Deshabilitar</Button>
              </form>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
