import { Badge, statusTone } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/formatting/format";
import { prisma } from "@/server/db/client";

export default async function AdminNotificationsPage() {
  const events = await prisma.notificationEvent.findMany({
    include: { device: true, profile: true, user: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Notificaciones locales</h1>
        <p className="mt-1 text-sm text-neutral-600">Simuladas: no se envían mensajes reales.</p>
      </header>
      <div className="grid gap-3">
        {events.map((event) => (
          <Card key={event.id}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold">{event.eventType}</h2>
                <p className="text-sm text-neutral-600">{event.channel} · {event.recipient ?? "sin receptor"} · {formatDate(event.createdAt)}</p>
              </div>
              <Badge tone={statusTone(event.status)}>{event.status}</Badge>
            </div>
            <pre className="mt-3 overflow-auto rounded-md bg-neutral-100 p-3 text-xs text-neutral-700">{event.payload}</pre>
          </Card>
        ))}
      </div>
    </div>
  );
}
