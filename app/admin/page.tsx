import { Activity, Bell, Building2, Package, QrCode, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getAdminMetrics } from "@/server/analytics/metrics";

export default async function AdminPage() {
  const metrics = await getAdminMetrics();
  const items = [
    { label: "Lotes", value: metrics.batches, Icon: Package },
    { label: "Dispositivos", value: metrics.devices, Icon: QrCode },
    { label: "Activación", value: `${metrics.activationRate}%`, Icon: Activity },
    { label: "Perfiles", value: metrics.profiles, Icon: Users },
    { label: "Organizaciones", value: metrics.organizations, Icon: Building2 },
    { label: "Notificaciones", value: metrics.notifications, Icon: Bell },
  ];

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Panel administrador</h1>
        <p className="mt-1 text-sm text-neutral-600">Métricas locales desde SQLite.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
