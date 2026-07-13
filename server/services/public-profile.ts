import type { ContactActionType, ScanMethod } from "@prisma/client";
import { hashIpAddress } from "@/lib/security/hashing";
import { buildPublicProfileView, type PublicContactView, type PublicProfileView } from "@/server/profiles/public-view";
import { prisma } from "@/server/db/client";
import { notificationProvider } from "@/server/notifications/provider";

export type PublicProfileResult =
  | { status: "INVALID_CODE"; publicCode: string }
  | { status: "NOT_ACTIVATED"; publicCode: string; deviceStatus: string }
  | { status: "UNAVAILABLE"; publicCode: string; deviceStatus: string }
  | {
      status: "ACTIVE" | "LOST" | "FOUND";
      publicCode: string;
      deviceId: string;
      scanId: string;
      deviceStatus: string;
      productType: string;
      profile: PublicProfileView;
      contacts: PublicContactView[];
    };

export async function resolvePublicProfile({
  publicCode,
  method = "QR",
  ip,
  userAgent,
  referrer,
}: {
  publicCode: string;
  method?: ScanMethod;
  ip?: string | null;
  userAgent?: string | null;
  referrer?: string | null;
}): Promise<PublicProfileResult> {
  const normalizedCode = publicCode.trim().toUpperCase();
  if (!/^[A-Z0-9]{4,12}$/.test(normalizedCode)) {
    return { status: "INVALID_CODE", publicCode: normalizedCode };
  }

  const device = await prisma.device.findUnique({
    where: { publicCode: normalizedCode },
    include: {
      profile: {
        include: {
          contacts: {
            where: { isVisible: true },
            orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
          },
        },
      },
    },
  });

  if (!device) return { status: "INVALID_CODE", publicCode: normalizedCode };

  if (["AVAILABLE", "UNASSIGNED", "RESERVED"].includes(device.status)) {
    return {
      status: "NOT_ACTIVATED",
      publicCode: normalizedCode,
      deviceStatus: device.status,
    };
  }

  if (!device.profile || !device.profile.isPublic) {
    return {
      status: "UNAVAILABLE",
      publicCode: normalizedCode,
      deviceStatus: device.status,
    };
  }

  if (["SUSPENDED", "DEACTIVATED", "REPLACED", "DAMAGED"].includes(device.status)) {
    return {
      status: "UNAVAILABLE",
      publicCode: normalizedCode,
      deviceStatus: device.status,
    };
  }

  const scan = await prisma.scanEvent.create({
    data: {
      deviceId: device.id,
      profileId: device.profileId,
      scanMethod: method,
      ipHash: hashIpAddress(ip),
      userAgent,
      referrer,
      deviceType: userAgent?.toLowerCase().includes("mobile") ? "mobile" : "unknown",
      eventStatus: "RECORDED",
    },
  });

  await prisma.contactAction.create({
    data: {
      deviceId: device.id,
      profileId: device.profileId,
      scanEventId: scan.id,
      action: "PROFILE_VIEWED",
      ipHash: hashIpAddress(ip),
      userAgent,
    },
  });

  await notificationProvider.sendLocal({
    userId: device.ownerId,
    deviceId: device.id,
    profileId: device.profileId,
    scanEventId: scan.id,
    eventType: "DEVICE_SCANNED",
    payload: {
      publicCode: device.publicCode,
      status: device.status,
      scanId: scan.id,
    },
  });

  const profile = device.profile;
  const publicProfile = buildPublicProfileView(profile);
  const resultStatus = device.status === "LOST" ? "LOST" : device.status === "FOUND" ? "FOUND" : "ACTIVE";

  return {
    status: resultStatus,
    publicCode: normalizedCode,
    deviceId: device.id,
    scanId: scan.id,
    deviceStatus: device.status,
    productType: device.productType,
    profile: publicProfile,
    contacts: publicProfile.contacts,
  };
}

export async function recordPublicContactAction({
  scanId,
  action,
  latitude,
  longitude,
  accuracy,
  ip,
  userAgent,
}: {
  scanId: string;
  action: ContactActionType;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const scan = await prisma.scanEvent.findUnique({
    where: { id: scanId },
    include: { device: true },
  });
  if (!scan) throw new Error("Scan no encontrado.");

  if (action === "LOCATION_SHARED") {
    await prisma.scanEvent.update({
      where: { id: scanId },
      data: {
        latitude,
        longitude,
        locationAccuracy: accuracy,
        locationPermission: true,
        locationSharedAt: new Date(),
      },
    });
  }

  await prisma.contactAction.create({
    data: {
      deviceId: scan.deviceId,
      profileId: scan.profileId,
      scanEventId: scan.id,
      action,
      metadata: JSON.stringify({ latitude, longitude, accuracy }),
      ipHash: hashIpAddress(ip),
      userAgent,
    },
  });

  const eventType =
    action === "LOCATION_SHARED"
      ? "LOCATION_SHARED"
      : action === "CALL_CLICKED"
        ? "CALL_BUTTON_CLICKED"
        : action === "WHATSAPP_CLICKED"
          ? "WHATSAPP_BUTTON_CLICKED"
          : action === "FOUND_REPORTED"
            ? "MARKED_AS_FOUND"
            : action === "EMERGENCY_REPORTED"
              ? "EMERGENCY_REPORTED"
              : "CONTACT_BUTTON_CLICKED";

  await notificationProvider.sendLocal({
    userId: scan.device.ownerId,
    deviceId: scan.deviceId,
    profileId: scan.profileId,
    scanEventId: scan.id,
    eventType,
    payload: {
      action,
      publicCode: scan.device.publicCode,
      locationShared: action === "LOCATION_SHARED",
    },
  });
}
