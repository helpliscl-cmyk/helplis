import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { recordPublicContactAction } from "@/server/services/public-profile";
import { checkRateLimit } from "@/server/security/rate-limit";

const schema = z.object({
  scanId: z.string().min(1),
  publicCode: z.string().min(4).max(12).optional(),
  permissionStatus: z.enum(["GRANTED", "DENIED", "UNAVAILABLE"]).default("GRANTED"),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  accuracy: z.number().min(0).max(100000).optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Ubicacion invalida." }, { status: 400 });
  }

  const action = parsed.data.permissionStatus === "GRANTED" ? "LOCATION_SHARED" : "LOCATION_REJECTED";
  if (action === "LOCATION_SHARED" && (parsed.data.latitude == null || parsed.data.longitude == null)) {
    return NextResponse.json({ ok: false, message: "Ubicacion invalida." }, { status: 400 });
  }

  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(`public-location:${ip}:${parsed.data.scanId}`, 10, 60_000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  await recordPublicContactAction({
    scanId: parsed.data.scanId,
    publicCode: parsed.data.publicCode,
    action,
    latitude: parsed.data.latitude,
    longitude: parsed.data.longitude,
    accuracy: parsed.data.accuracy,
    locationPermissionStatus: parsed.data.permissionStatus,
    ip,
    userAgent: headerStore.get("user-agent"),
  });

  return NextResponse.json({
    ok: true,
    message: action === "LOCATION_SHARED" ? "Ubicacion compartida." : "Preferencia registrada.",
  });
}
