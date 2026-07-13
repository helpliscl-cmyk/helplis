import { redirect } from "next/navigation";
import { z } from "zod";
import { getSession, isAdminRole } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/security/hashing";
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

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });

  if (!parsed.success) loginErrorRedirect();

  const nextPath = safeNextPath(parsed.data.next);
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || user.status !== "ACTIVE") loginErrorRedirect(nextPath ?? undefined);

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    await prisma.auditLog.create({
      data: {
        action: "LOGIN_FAILED",
        entityType: "User",
        entityId: user.id,
        newData: JSON.stringify({ email: parsed.data.email }),
      },
    });
    loginErrorRedirect(nextPath ?? undefined);
  }

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
