import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { recordPublicContactAction } from "@/server/services/public-profile";
import { checkRateLimit } from "@/server/security/rate-limit";

const schema = z.object({
  scanId: z.string().min(1),
  publicCode: z.string().min(4).max(12).optional(),
  action: z.enum([
    "CALL_CLICKED",
    "WHATSAPP_CLICKED",
    "MESSAGE_CLICKED",
    "LOCATION_SHARED",
    "LOCATION_REJECTED",
    "FOUND_REPORTED",
    "EMERGENCY_REPORTED",
    "PROFILE_VIEWED",
    "LINK_COPIED",
  ]),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(`public-contact:${ip}:${parsed.data.scanId}`, 30, 60_000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  await recordPublicContactAction({
    scanId: parsed.data.scanId,
    publicCode: parsed.data.publicCode,
    action: parsed.data.action,
    ip,
    userAgent: headerStore.get("user-agent"),
  });

  return NextResponse.json({ ok: true });
}
