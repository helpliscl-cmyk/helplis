import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { isAdminRole, requireUser } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (isAdminRole(user.role)) redirect("/admin");
  return <AppShell>{children}</AppShell>;
}
