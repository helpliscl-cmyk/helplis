import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/formatting/format";
import { prisma } from "@/server/db/client";

export default async function AdminAuditPage() {
  const logs = await prisma.auditLog.findMany({
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div className="grid gap-5">
      <h1 className="text-2xl font-semibold">Auditoría</h1>
      <div className="grid gap-3">
        {logs.map((log) => (
          <Card key={log.id}>
            <h2 className="font-semibold">{log.action}</h2>
            <p className="text-sm text-neutral-600">{log.entityType} · {log.actor?.email ?? "Sistema"} · {formatDate(log.createdAt)}</p>
            {log.newData ? <pre className="mt-3 overflow-auto rounded-md bg-neutral-100 p-3 text-xs">{log.newData}</pre> : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
