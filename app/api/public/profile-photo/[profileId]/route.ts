import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { getDeviceActivationState } from "@/server/services/device-rules";
import {
  PROFILE_PHOTO_PUBLIC_CACHE,
  readPrivateProfilePhoto,
} from "@/server/services/profile-photo-storage";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ profileId: string }> }) {
  const { profileId } = await params;
  const profile = await prisma.profile.findFirst({
    where: {
      id: profileId,
      deletedAt: null,
      isPublic: true,
      showPhoto: true,
      photoStoragePath: { not: null },
    },
    select: {
      photoStoragePath: true,
      photoMimeType: true,
      devices: {
        where: { deletedAt: null },
        select: { status: true },
      },
    },
  });

  const hasActivePublicDevice = profile?.devices.some((device) => getDeviceActivationState(device.status) === "ACTIVE");
  if (!profile?.photoStoragePath || !hasActivePublicDevice) {
    return new NextResponse(null, {
      status: 404,
      headers: { "cache-control": PROFILE_PHOTO_PUBLIC_CACHE },
    });
  }

  const photo = await readPrivateProfilePhoto(profile.photoStoragePath);
  if (!photo) {
    return new NextResponse(null, {
      status: 404,
      headers: { "cache-control": PROFILE_PHOTO_PUBLIC_CACHE },
    });
  }

  return new NextResponse(photo, {
    headers: {
      "content-type": profile.photoMimeType ?? "image/webp",
      "cache-control": PROFILE_PHOTO_PUBLIC_CACHE,
      "x-content-type-options": "nosniff",
    },
  });
}
