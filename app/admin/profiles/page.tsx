import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { prisma } from "@/server/db/client";

export default async function AdminProfilesPage() {
  const profiles = await prisma.profile.findMany({
    include: { owner: true, _count: { select: { contacts: true, devices: true, scanEvents: true } } },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  return (
    <div className="grid gap-5">
      <h1 className="text-2xl font-semibold">Perfiles</h1>
      <div className="grid gap-3">
        {profiles.map((profile) => (
          <Card key={profile.id} className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <div>
              <h2 className="font-semibold">{profile.displayName}</h2>
              <p className="text-sm text-neutral-600">{profile.owner?.email ?? "Sin dueño"} · {profile._count.contacts} contactos · {profile._count.scanEvents} escaneos</p>
            </div>
            <Badge>{profile.type}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
