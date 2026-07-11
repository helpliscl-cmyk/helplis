import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { recordPublicContactAction } from "@/server/services/public-profile";

const schema = z.object({
  scanId: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().min(0).max(100000).optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Ubicación inválida." }, { status: 400 });
  }

  const headerStore = await headers();
  await recordPublicContactAction({
    scanId: parsed.data.scanId,
    action: "LOCATION_SHARED",
    latitude: parsed.data.latitude,
    longitude: parsed.data.longitude,
    accuracy: parsed.data.accuracy,
    ip: headerStore.get("x-forwarded-for"),
    userAgent: headerStore.get("user-agent"),
  });

  return NextResponse.json({ ok: true, message: "Ubicación compartida." });
}
