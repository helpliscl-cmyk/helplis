import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { formatDate } from "@/lib/formatting/format";
import { prisma } from "@/server/db/client";

export default async function DashboardScansPage() {
  const user = await requireUser();
  const scans = await prisma.scanEvent.findMany({
    where: { device: { ownerId: user.id } },
    include: { device: true, profile: true },
    orderBy: { scannedAt: "desc" },
    take: 50,
  });

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Escaneos</h1>
        <p className="mt-1 text-sm text-neutral-600">Historial local de los últimos eventos públicos.</p>
      </header>
      <div className="grid gap-3">
        {scans.map((scan) => (
          <Card key={scan.id} className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <div>
              <h2 className="font-semibold">{scan.profile?.displayName ?? scan.device.publicCode}</h2>
              <p className="text-sm text-neutral-600">
                {scan.device.publicCode} · {formatDate(scan.scannedAt)} · {scan.city ?? "Sin ciudad"}
              </p>
            </div>
            <Badge>{scan.scanMethod}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
