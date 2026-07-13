import { redirect } from "next/navigation";
import { z } from "zod";
import { getSession, isAdminRole } from "@/lib/auth/session";
import { env } from "@/lib/env/server";
import { isDemoEmail, productionRequiresPersistentDatabase } from "@/lib/runtime/production-safety";
import { hashPassword, verifyPassword } from "@/lib/security/hashing";
import { prisma } from "@/server/db/client";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  next: z.string().optional(),
});

function loginErrorRedirect(next?: string): never {
  const query = new URLSearchParams({ error: "invalid" });
  if (next) query.set("next", next);
  redirect(`/login?${query.toString()}`);
}

function safeNextPath(next?: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

function supabaseAuthConfig() {
  const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url: url.replace(/\/+$/, ""), anonKey };
}

async function authenticateWithSupabase(email: string, password: string) {
  const config = supabaseAuthConfig();
  if (!config) return null;

  const response = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: config.anonKey,
      authorization: `Bearer ${config.anonKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  if (!response.ok) return null;
  const payload = (await response.json()) as { user?: { id?: string; email?: string; user_metadata?: { name?: string } } };
  if (!payload.user?.id || !payload.user.email) return null;
  return {
    id: payload.user.id,
    email: payload.user.email.toLowerCase(),
    name: payload.user.user_metadata?.name || payload.user.email.split("@")[0],
  };
}

async function findOrBootstrapSupabaseUser(authUser: { id: string; email: string; name: string }) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ id: authUser.id }, { email: authUser.email }] },
  });
  if (existing) return existing;

  if (authUser.email !== env.ADMIN_EMAIL.toLowerCase()) return null;

  return prisma.user.create({
    data: {
      id: authUser.id,
      email: authUser.email,
      name: authUser.name || "Administrador HelPlis",
      phone: env.ADMIN_PHONE,
      passwordHash: await hashPassword(`supabase:${authUser.id}:${Date.now()}`),
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });

  if (!parsed.success) loginErrorRedirect();

  const nextPath = safeNextPath(parsed.data.next);
  const email = parsed.data.email.toLowerCase();

  if (productionRequiresPersistentDatabase() && isDemoEmail(email)) {
    loginErrorRedirect(nextPath ?? undefined);
  }

  const supabaseAuthUser = await authenticateWithSupabase(email, parsed.data.password);
  let user = supabaseAuthUser ? await findOrBootstrapSupabaseUser(supabaseAuthUser) : null;

  if (!user && !productionRequiresPersistentDatabase() && env.AUTH_PROVIDER !== "supabase") {
    user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const valid = await verifyPassword(parsed.data.password, user.passwordHash);
      if (!valid) {
        await prisma.auditLog.create({
          data: {
            action: "LOGIN_FAILED",
            entityType: "User",
            entityId: user.id,
            newData: JSON.stringify({ email }),
          },
        });
        loginErrorRedirect(nextPath ?? undefined);
      }
    }
  }

  if (!user || user.status !== "ACTIVE") loginErrorRedirect(nextPath ?? undefined);

  const session = await getSession();
  session.user = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
  await session.save();

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  redirect(nextPath ?? (isAdminRole(user.role) ? "/admin" : "/dashboard"));
}
