import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["ADMIN", "SUPER_ADMIN", "SUPPORT"]);
  return <AppShell mode="admin">{children}</AppShell>;
}
