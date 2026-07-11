import { Badge, statusTone } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/formatting/format";
import { prisma } from "@/server/db/client";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    include: { _count: { select: { devices: true, profiles: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="grid gap-5">
      <h1 className="text-2xl font-semibold">Usuarios</h1>
      <div className="grid gap-3">
        {users.map((user) => (
          <Card key={user.id} className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <div>
              <h2 className="font-semibold">{user.name}</h2>
              <p className="text-sm text-neutral-600">{user.email} · {user.role} · {formatDate(user.lastLoginAt)}</p>
              <p className="text-xs text-neutral-500">{user._count.devices} dispositivos · {user._count.profiles} perfiles</p>
            </div>
            <Badge tone={statusTone(user.status)}>{user.status}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
