import { Activity, Bell, MapPin, QrCode, UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getUserMetrics } from "@/server/analytics/metrics";

export default async function DashboardPage() {
  const user = await requireUser();
  const metrics = await getUserMetrics(user.id);
  const items = [
    { label: "Dispositivos", value: metrics.devices, Icon: QrCode },
    { label: "Perfiles", value: metrics.profiles, Icon: UserRound },
    { label: "Escaneos", value: metrics.scans, Icon: Activity },
    { label: "Ubicaciones", value: metrics.locations, Icon: MapPin },
    { label: "Notificaciones", value: metrics.notifications, Icon: Bell },
  ];

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Resumen</h1>
        <p className="mt-1 text-sm text-neutral-600">Sesión local de {user.name}</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {items.map(({ label, value, Icon }) => (
          <Card key={label}>
            <Icon aria-hidden className="mb-3 h-5 w-5 text-neutral-600" />
            <div className="text-3xl font-semibold">{value}</div>
            <div className="text-sm text-neutral-600">{label}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
