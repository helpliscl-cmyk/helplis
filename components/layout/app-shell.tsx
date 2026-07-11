import Link from "next/link";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

const dashboardLinks = [
  ["/dashboard", "Resumen"],
  ["/dashboard/devices", "Dispositivos"],
  ["/dashboard/profiles", "Perfiles"],
  ["/dashboard/contacts", "Contactos"],
  ["/dashboard/scans", "Escaneos"],
  ["/dashboard/locations", "Ubicaciones"],
  ["/dashboard/privacy", "Privacidad"],
  ["/dashboard/account", "Cuenta"],
  ["/dashboard/support", "Soporte"],
];

const adminLinks = [
  ["/admin", "Admin"],
  ["/admin/devices", "Dispositivos"],
  ["/admin/batches", "Lotes"],
  ["/admin/imports", "Importaciones"],
  ["/admin/users", "Usuarios"],
  ["/admin/profiles", "Perfiles"],
  ["/admin/organizations", "Organizaciones"],
  ["/admin/campaigns", "Campañas"],
  ["/admin/scans", "Escaneos"],
  ["/admin/notifications", "Notificaciones"],
  ["/admin/audit", "Auditoría"],
  ["/admin/errors", "Errores"],
  ["/admin/settings", "Ajustes"],
];

export function AppShell({
  children,
  mode = "dashboard",
}: {
  children: React.ReactNode;
  mode?: "dashboard" | "admin";
}) {
  const links = mode === "admin" ? adminLinks : dashboardLinks;

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-lg font-semibold text-neutral-950">
            HelPlis
          </Link>
          <form action={logoutAction}>
            <Button variant="ghost" type="submit">
              <LogOut aria-hidden className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </form>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[240px_1fr]">
        <nav aria-label={mode === "admin" ? "Navegación administrativa" : "Navegación de usuario"}>
          <div className="grid gap-1 rounded-lg border border-neutral-200 bg-white p-2">
            {links.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-950"
              >
                {label}
              </Link>
            ))}
          </div>
        </nav>
        <main>{children}</main>
      </div>
    </div>
  );
}
