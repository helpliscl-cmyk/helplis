import "server-only";
import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { env } from "@/lib/env/server";
import { prisma } from "@/server/db/client";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export type AppSession = {
  user?: SessionUser;
};

const sessionOptions: SessionOptions = {
  cookieName: "helplis_session",
  password: env.AUTH_SECRET,
  ttl: 60 * 60 * 8,
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  },
};

export async function getSession() {
  return getIronSession<AppSession>(await cookies(), sessionOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session.user) return null;
  const user = await prisma.user.findFirst({
    where: { id: session.user.id, deletedAt: null, status: "ACTIVE" },
  });
  if (!user) return null;
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");
  return user;
}

export async function requireRole(roles: UserRole[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/dashboard?error=forbidden");
  return user;
}

export function isAdminRole(role: UserRole) {
  return ["ADMIN", "SUPER_ADMIN", "SUPPORT"].includes(role);
}
