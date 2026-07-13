import { Activity, Bell, Building2, Package, QrCode, ShoppingBag, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getAdminMetrics } from "@/server/analytics/metrics";

export default async function AdminPage() {
  const metrics = await getAdminMetrics();
  const items = [
    { label: "Lotes", value: metrics.batches, Icon: Package },
    { label: "Dispositivos", value: metrics.devices, Icon: QrCode },
    { label: "Activacion", value: `${metrics.activationRate}%`, Icon: Activity },
    { label: "Perfiles", value: metrics.profiles, Icon: Users },
    { label: "Leads", value: metrics.purchaseIntents, Icon: ShoppingBag },
    { label: "Organizaciones", value: metrics.organizations, Icon: Building2 },
    { label: "Notificaciones", value: metrics.notifications, Icon: Bell },
  ];

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Panel administrador</h1>
        <p className="mt-1 text-sm text-neutral-600">Metricas operativas desde la base de datos de produccion.</p>
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
      <Card>
        <h2 className="font-semibold">Embudo comercial</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <div className="text-2xl font-semibold">{metrics.pricingViews}</div>
            <div className="text-sm text-neutral-600">Vistas de precios</div>
          </div>
          <div>
            <div className="text-2xl font-semibold">{metrics.orderIntentCompleted}</div>
            <div className="text-sm text-neutral-600">Solicitudes completadas</div>
          </div>
          <div>
            <div className="text-2xl font-semibold">{metrics.whatsappOrderClicks}</div>
            <div className="text-sm text-neutral-600">Clicks a WhatsApp</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
