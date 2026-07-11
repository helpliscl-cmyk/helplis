"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSession, isAdminRole } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/security/hashing";
import { prisma } from "@/server/db/client";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  next: z.string().optional(),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(10),
});

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });

  if (!parsed.success) redirect("/login?error=invalid");

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || user.status !== "ACTIVE") redirect("/login?error=invalid");

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
    redirect("/login?error=invalid");
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

  if (parsed.data.next?.startsWith("/")) redirect(parsed.data.next);
  redirect(isAdminRole(user.role) ? "/admin" : "/dashboard");
}

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    password: formData.get("password"),
  });

  if (!parsed.success) redirect("/register?error=invalid");

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) redirect("/register?error=exists");

  const user = await prisma.user.create({
    data: {
      email,
      name: parsed.data.name,
      phone: parsed.data.phone,
      passwordHash: await hashPassword(parsed.data.password),
      role: "USER",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "USER_REGISTERED",
      entityType: "User",
      entityId: user.id,
    },
  });

  const session = await getSession();
  session.user = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
  await session.save();
  redirect("/dashboard");
}

export async function logoutAction() {
  const session = await getSession();
  session.destroy();
  redirect("/");
}
