import { Card } from "@/components/ui/card";
import { OFFICIAL_CONTACT, PUBLIC_BASE_URL } from "@/lib/constants";

export default function AdminSettingsPage() {
  return (
    <div className="grid gap-5">
      <h1 className="text-2xl font-semibold">Ajustes</h1>
      <Card>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-neutral-500">Dominio base</dt>
            <dd>{PUBLIC_BASE_URL}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Correo admin</dt>
            <dd>{OFFICIAL_CONTACT.email}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">WhatsApp admin</dt>
            <dd>{OFFICIAL_CONTACT.phoneDisplay}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Proveedores</dt>
            <dd>local/mock</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
