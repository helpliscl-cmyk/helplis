import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/client";

const eventSchema = z.object({
  eventName: z.string().min(2).max(80),
  path: z.string().max(240).optional(),
  target: z.string().max(160).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await prisma.analyticsEvent.create({
    data: {
      eventName: parsed.data.eventName,
      path: parsed.data.path,
      target: parsed.data.target,
      metadata: parsed.data.metadata ? JSON.stringify(parsed.data.metadata) : undefined,
    },
  });

  return NextResponse.json({ ok: true });
}
