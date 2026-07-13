import type { ContactActionType, ScanMethod } from "@prisma/client";
import { hashIpAddress } from "@/lib/security/hashing";
import {
  buildPublicProfileView,
  normalizePhone,
  type PublicContactView,
  type PublicProfileView,
} from "@/server/profiles/public-view";
import { prisma } from "@/server/db/client";
import { notificationProvider } from "@/server/notifications/provider";
import { checkRateLimit } from "@/server/security/rate-limit";
import { getDeviceActivationState, isPubliclyUnavailableStatus } from "@/server/services/device-rules";

export type PublicProfileResult =
  | { status: "INVALID_CODE"; publicCode: string }
  | { status: "NOT_ACTIVATED"; publicCode: string; deviceStatus: string; activationState: "UNACTIVATED" }
  | {
      status: "UNAVAILABLE";
      publicCode: string;
      deviceStatus: string;
      activationState: "SUSPENDED" | "DISABLED" | "ACTIVE";
    }
  | {
      status: "ACTIVE" | "LOST" | "FOUND";
      publicCode: string;
      deviceId: string;
      scanId: string;
      deviceStatus: string;
      activationState: "ACTIVE";
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
  const ipHash = hashIpAddress(ip);
  if (!checkRateLimit(`scan:${ipHash}:${normalizedCode}`, 60, 60_000)) {
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

  const activationState = getDeviceActivationState(device.status);

  if (activationState === "UNACTIVATED") {
    return {
      status: "NOT_ACTIVATED",
      publicCode: normalizedCode,
      deviceStatus: device.status,
      activationState,
    };
  }

  if (isPubliclyUnavailableStatus(device.status)) {
    return {
      status: "UNAVAILABLE",
      publicCode: normalizedCode,
      deviceStatus: device.status,
      activationState,
    };
  }

  if (!device.profile || !device.profile.isPublic) {
    return {
      status: "UNAVAILABLE",
      publicCode: normalizedCode,
      deviceStatus: device.status,
      activationState,
    };
  }

  const scan = await prisma.scanEvent.create({
    data: {
      deviceId: device.id,
      profileId: device.profileId,
      scanMethod: method,
      ipHash,
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
      ipHash,
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
    activationState: "ACTIVE",
    productType: device.productType,
    profile: publicProfile,
    contacts: publicProfile.contacts,
  };
}

async function findOrCreatePublicActionScan({
  scanId,
  publicCode,
  ip,
  userAgent,
}: {
  scanId: string;
  publicCode?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const existingScan = await prisma.scanEvent.findUnique({
    where: { id: scanId },
    include: { device: true },
  });
  if (existingScan) return existingScan;

  const normalizedCode = publicCode?.trim().toUpperCase();
  if (!normalizedCode || !/^[A-Z0-9]{4,12}$/.test(normalizedCode)) return null;

  const device = await prisma.device.findUnique({
    where: { publicCode: normalizedCode },
    include: { profile: true },
  });
  if (!device?.profile?.isPublic) return null;
  if (getDeviceActivationState(device.status) !== "ACTIVE") return null;

  return prisma.scanEvent.create({
    data: {
      deviceId: device.id,
      profileId: device.profileId,
      scanMethod: "UNKNOWN",
      ipHash: hashIpAddress(ip),
      userAgent,
      deviceType: userAgent?.toLowerCase().includes("mobile") ? "mobile" : "unknown",
      eventStatus: "RECORDED",
    },
    include: { device: true },
  });
}

export async function recordPublicContactAction({
  scanId,
  publicCode,
  action,
  latitude,
  longitude,
  accuracy,
  locationPermissionStatus,
  ip,
  userAgent,
}: {
  scanId: string;
  publicCode?: string | null;
  action: ContactActionType;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  locationPermissionStatus?: "GRANTED" | "DENIED" | "UNAVAILABLE";
  ip?: string | null;
  userAgent?: string | null;
}) {
  const scan = await findOrCreatePublicActionScan({ scanId, publicCode, ip, userAgent });
  if (!scan) throw new Error("Scan no encontrado.");

  if (action === "LOCATION_SHARED") {
    await prisma.scanEvent.update({
      where: { id: scan.id },
      data: {
        latitude,
        longitude,
        locationAccuracy: accuracy,
        locationPermission: true,
        locationSharedAt: new Date(),
      },
    });

    await prisma.locationShare.create({
      data: {
        deviceId: scan.deviceId,
        profileId: scan.profileId,
        scanEventId: scan.id,
        latitude,
        longitude,
        accuracy,
        consented: true,
        permissionStatus: locationPermissionStatus ?? "GRANTED",
        result: "RECORDED",
        ipHash: hashIpAddress(ip),
        userAgent,
      },
    });
  }

  if (action === "LOCATION_REJECTED") {
    await prisma.locationShare.create({
      data: {
        deviceId: scan.deviceId,
        profileId: scan.profileId,
        scanEventId: scan.id,
        consented: false,
        permissionStatus: locationPermissionStatus ?? "DENIED",
        result: "REJECTED",
        ipHash: hashIpAddress(ip),
        userAgent,
      },
    });
  }

  await prisma.contactAction.create({
    data: {
      deviceId: scan.deviceId,
      profileId: scan.profileId,
      scanEventId: scan.id,
      action,
      metadata: JSON.stringify({ latitude, longitude, accuracy, locationPermissionStatus }),
      ipHash: hashIpAddress(ip),
      userAgent,
    },
  });

  const eventType =
    action === "LOCATION_SHARED"
      ? "LOCATION_SHARED"
      : action === "LOCATION_REJECTED"
        ? "CONTACT_BUTTON_CLICKED"
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

export async function resolvePublicContactLink({
  scanId,
  publicCode,
  action,
  ip,
  userAgent,
}: {
  scanId: string;
  publicCode?: string | null;
  action: "CALL_CLICKED" | "WHATSAPP_CLICKED";
  ip?: string | null;
  userAgent?: string | null;
}) {
  const scan = await findOrCreatePublicActionScan({ scanId, publicCode, ip, userAgent });
  if (!scan?.profileId) return null;

  const profile = await prisma.profile.findUnique({
    where: { id: scan.profileId },
    include: {
      contacts: {
        where: { isVisible: true },
        orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  if (!profile?.isPublic) return null;
  if (getDeviceActivationState(scan.device.status) !== "ACTIVE") return null;

  const allowsCall = profile.allowCall && profile.showCallButton;
  const allowsWhatsapp = profile.allowWhatsApp && profile.showWhatsAppButton;
  const contact = profile.contacts.find((candidate) => {
    const phone = normalizePhone(candidate.phone);
    if (!phone) return false;
    if (action === "CALL_CLICKED") return allowsCall && candidate.callEnabled;
    return allowsWhatsapp && candidate.whatsappEnabled;
  });
  const phone = normalizePhone(contact?.phone ?? null);
  if (!phone) return null;

  await recordPublicContactAction({ scanId: scan.id, publicCode: scan.device.publicCode, action, ip, userAgent });

  if (action === "CALL_CLICKED") {
    return { href: `tel:${phone}` };
  }

  const digits = phone.replace(/\D/g, "");
  const message = encodeURIComponent(`Hola, escanee el codigo ${scan.device.publicCode} en HelPlis.`);
  return { href: `https://wa.me/${digits}?text=${message}` };
}

export async function recordFoundReport({
  scanId,
  publicCode,
  reporterName,
  reporterPhone,
  message,
  latitude,
  longitude,
  accuracy,
  consentedLocation = false,
  ip,
  userAgent,
}: {
  scanId: string;
  publicCode?: string | null;
  reporterName?: string | null;
  reporterPhone?: string | null;
  message?: string | null;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  consentedLocation?: boolean;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const scan = await findOrCreatePublicActionScan({ scanId, publicCode, ip, userAgent });
  if (!scan) throw new Error("Scan no encontrado.");

  const cleanName = sanitizeOptional(reporterName, 120);
  const cleanPhone = sanitizeOptional(reporterPhone, 32);
  const cleanMessage = sanitizeOptional(message, 700);

  const foundReport = await prisma.foundReport.create({
    data: {
      deviceId: scan.deviceId,
      profileId: scan.profileId,
      scanEventId: scan.id,
      reporterName: cleanName,
      reporterPhone: cleanPhone,
      message: cleanMessage,
      latitude,
      longitude,
      accuracy,
      consentedLocation,
      status: "RECEIVED",
      ipHash: hashIpAddress(ip),
      userAgent,
    },
  });

  await prisma.contactAction.create({
    data: {
      deviceId: scan.deviceId,
      profileId: scan.profileId,
      scanEventId: scan.id,
      action: "FOUND_REPORTED",
      metadata: JSON.stringify({ foundReportId: foundReport.id, hasReporterPhone: Boolean(cleanPhone) }),
      ipHash: hashIpAddress(ip),
      userAgent,
    },
  });

  await notificationProvider.sendLocal({
    userId: scan.device.ownerId,
    deviceId: scan.deviceId,
    profileId: scan.profileId,
    scanEventId: scan.id,
    eventType: "MARKED_AS_FOUND",
    payload: {
      publicCode: scan.device.publicCode,
      foundReportId: foundReport.id,
      hasMessage: Boolean(cleanMessage),
      locationShared: consentedLocation,
    },
  });

  return foundReport;
}

function sanitizeOptional(value: string | null | undefined, maxLength: number) {
  if (!value) return null;
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;
  if (/<[^>]*>|javascript:|data:text\/html|vbscript:/i.test(trimmed)) return null;
  return trimmed.slice(0, maxLength);
}
