import Link from "next/link";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { updateDeviceStatusAction } from "@/features/profiles/actions";
import { formatDate } from "@/lib/formatting/format";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/server/db/client";

export default async function DashboardDevicesPage() {
  const user = await requireUser();
  const devices = await prisma.device.findMany({
    where: { ownerId: user.id },
    include: {
      profile: true,
      organization: true,
      scanEvents: { orderBy: { scannedAt: "desc" }, take: 1 },
      _count: { select: { scanEvents: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Mis dispositivos</h1>
        <p className="mt-1 text-sm text-neutral-600">Gestiona estado, vista pública y datos asociados.</p>
      </header>
      <div className="grid gap-4">
        {devices.map((device) => (
          <Card key={device.id} className="grid gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">{device.profile?.displayName ?? "Sin perfil"}</h2>
                <p className="text-sm text-neutral-600">
                  {device.productType} · {device.publicCode}
                </p>
              </div>
              <Badge tone={statusTone(device.status)}>{device.status}</Badge>
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-neutral-500">Activación</dt>
                <dd>{formatDate(device.activatedAt)}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Último escaneo</dt>
                <dd>{formatDate(device.scanEvents[0]?.scannedAt)}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Escaneos</dt>
                <dd>{device._count.scanEvents}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Organización</dt>
                <dd>{device.organization?.name ?? "Sin organización"}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-2">
              <Link className="rounded-md border border-neutral-300 px-3 py-2 text-sm" href={`/p/${device.publicCode}`}>
                Vista pública
              </Link>
              <form action={updateDeviceStatusAction}>
                <input type="hidden" name="deviceId" value={device.id} />
                <input type="hidden" name="status" value="LOST" />
                <Button type="submit" variant="secondary">Marcar perdido</Button>
              </form>
              <form action={updateDeviceStatusAction}>
                <input type="hidden" name="deviceId" value={device.id} />
                <input type="hidden" name="status" value="FOUND" />
                <Button type="submit" variant="secondary">Marcar encontrado</Button>
              </form>
              <form action={updateDeviceStatusAction}>
                <input type="hidden" name="deviceId" value={device.id} />
                <input type="hidden" name="status" value="ACTIVATED" />
                <Button type="submit" variant="ghost">Reactivar</Button>
              </form>
            </div>
          </Card>
        ))}
        {!devices.length ? <Card>No tienes dispositivos activados todavía.</Card> : null}
      </div>
    </div>
  );
}
