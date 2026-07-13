import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { recordFoundReport } from "@/server/services/public-profile";
import { checkRateLimit } from "@/server/security/rate-limit";

const schema = z.object({
  scanId: z.string().min(1),
  publicCode: z.string().min(4).max(12).optional(),
  reporterName: z.string().max(120).optional(),
  reporterPhone: z.string().max(32).optional(),
  message: z.string().max(700).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  accuracy: z.number().min(0).max(100000).optional(),
  consentedLocation: z.boolean().default(false),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(`public-found:${ip}:${parsed.data.scanId}`, 8, 60_000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  await recordFoundReport({
    scanId: parsed.data.scanId,
    publicCode: parsed.data.publicCode,
    reporterName: parsed.data.reporterName,
    reporterPhone: parsed.data.reporterPhone,
    message: parsed.data.message,
    latitude: parsed.data.latitude,
    longitude: parsed.data.longitude,
    accuracy: parsed.data.accuracy,
    consentedLocation: parsed.data.consentedLocation,
    ip,
    userAgent: headerStore.get("user-agent"),
  });

  return NextResponse.json({ ok: true });
}
