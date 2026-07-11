import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { recordPublicContactAction } from "@/server/services/public-profile";

const schema = z.object({
  scanId: z.string().min(1),
  action: z.enum([
    "CALL_CLICKED",
    "WHATSAPP_CLICKED",
    "MESSAGE_CLICKED",
    "LOCATION_SHARED",
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
  await recordPublicContactAction({
    scanId: parsed.data.scanId,
    action: parsed.data.action,
    ip: headerStore.get("x-forwarded-for"),
    userAgent: headerStore.get("user-agent"),
  });

  return NextResponse.json({ ok: true });
}
