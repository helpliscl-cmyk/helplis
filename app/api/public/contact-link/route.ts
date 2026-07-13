import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/server/security/rate-limit";
import { resolvePublicContactLink } from "@/server/services/public-profile";

const schema = z.object({
  scanId: z.string().min(1),
  action: z.enum(["CALL_CLICKED", "WHATSAPP_CLICKED"]),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(`public-contact-link:${ip}:${parsed.data.scanId}`, 20, 60_000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const link = await resolvePublicContactLink({
    scanId: parsed.data.scanId,
    action: parsed.data.action,
    ip,
    userAgent: headerStore.get("user-agent"),
  });
  if (!link) return NextResponse.json({ ok: false }, { status: 404 });

  return NextResponse.json({ ok: true, href: link.href }, { headers: { "cache-control": "no-store" } });
}
