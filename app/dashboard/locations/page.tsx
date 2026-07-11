import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { formatDate } from "@/lib/formatting/format";
import { prisma } from "@/server/db/client";

export default async function DashboardLocationsPage() {
  const user = await requireUser();
  const locations = await prisma.scanEvent.findMany({
    where: { device: { ownerId: user.id }, locationPermission: true },
    include: { device: true, profile: true },
    orderBy: { locationSharedAt: "desc" },
    take: 50,
  });

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Ubicaciones compartidas</h1>
        <p className="mt-1 text-sm text-neutral-600">Solo se registran cuando quien escanea acepta compartirlas.</p>
      </header>
      <div className="grid gap-3">
        {locations.map((scan) => (
          <Card key={scan.id}>
            <h2 className="font-semibold">{scan.profile?.displayName ?? scan.device.publicCode}</h2>
            <p className="text-sm text-neutral-600">{formatDate(scan.locationSharedAt)}</p>
            <p className="mt-2 text-sm">
              Lat {scan.latitude?.toFixed(5)} · Lng {scan.longitude?.toFixed(5)} · precisión {scan.locationAccuracy ?? "N/D"} m
            </p>
          </Card>
        ))}
        {!locations.length ? <Card>No hay ubicaciones compartidas.</Card> : null}
      </div>
    </div>
  );
}
