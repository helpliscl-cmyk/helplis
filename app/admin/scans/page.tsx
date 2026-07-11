import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/formatting/format";
import { prisma } from "@/server/db/client";

export default async function AdminScansPage() {
  const scans = await prisma.scanEvent.findMany({
    include: { device: true, profile: true },
    orderBy: { scannedAt: "desc" },
    take: 100,
  });
  return (
    <div className="grid gap-5">
      <h1 className="text-2xl font-semibold">Escaneos</h1>
      <div className="grid gap-3">
        {scans.map((scan) => (
          <Card key={scan.id} className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <div>
              <h2 className="font-semibold">{scan.device.publicCode}</h2>
              <p className="text-sm text-neutral-600">{scan.profile?.displayName ?? "Sin perfil"} · {formatDate(scan.scannedAt)} · {scan.city ?? "Sin ciudad"}</p>
            </div>
            <Badge>{scan.scanMethod}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
