import { Card } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth/session";
import { formatDate } from "@/lib/formatting/format";

export default async function DashboardAccountPage() {
  const user = await requireUser();
  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Cuenta</h1>
        <p className="mt-1 text-sm text-neutral-600">Datos de sesión local provisional.</p>
      </header>
      <Card>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-neutral-500">Nombre</dt>
            <dd>{user.name}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Correo</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Rol</dt>
            <dd><Badge>{user.role}</Badge></dd>
          </div>
          <div>
            <dt className="text-neutral-500">Estado</dt>
            <dd><Badge tone={statusTone(user.status)}>{user.status}</Badge></dd>
          </div>
          <div>
            <dt className="text-neutral-500">Último login</dt>
            <dd>{formatDate(user.lastLoginAt)}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
