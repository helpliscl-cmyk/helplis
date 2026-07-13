import { NextResponse } from "next/server";
import { validateActivationPublicCode } from "@/server/services/activation";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { publicCode?: unknown } | null;
  const publicCode = typeof body?.publicCode === "string" ? body.publicCode : "";
  const result = await validateActivationPublicCode(publicCode);

  return NextResponse.json(result, {
    status: result.ok ? 200 : result.reason === "unavailable" || result.reason === "activated" ? 409 : 404,
    headers: { "cache-control": "no-store" },
  });
}
