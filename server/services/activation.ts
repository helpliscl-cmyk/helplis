import { z } from "zod";
import { hashPassword, verifyActivationCode, verifyPassword } from "@/lib/security/hashing";
import { prisma } from "@/server/db/client";
import { notificationProvider } from "@/server/notifications/provider";
import { canActivateStatus, getDeviceActivationState } from "@/server/services/device-rules";
import {
  deletePrivateProfilePhoto,
  processProfilePhotoDataUrl,
  ProfilePhotoError,
  storeProcessedProfilePhoto,
  type StoredProfilePhoto,
} from "@/server/services/profile-photo-storage";

const personProfileTypes = ["PERSON", "CHILD", "SENIOR", "DEPENDENT_PERSON", "MEDICAL_PROFILE"] as const;
const contactRelationships = ["MOTHER", "FATHER", "FAMILY", "RESPONSIBLE"] as const;

const localChilePhoneSchema = z
  .string()
  .trim()
  .regex(/^\d{8}$/, "El telefono debe tener exactamente ocho digitos despues de +569.");

const optionalCleanText = (max: number) =>
  z.preprocess((value) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }, z.string().max(max).optional());

const photoDataUrlSchema = z
  .string()
  .max(7_000_000)
  .regex(/^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/)
  .optional();

export const activationInputSchema = z
  .object({
    publicCode: z.string().trim().min(4).max(12),
    activationCode: z.string().trim().min(6).max(32),
    ownerName: z.string().trim().min(2).max(120),
    ownerPhoneLocal: localChilePhoneSchema,
    email: z.string().trim().email(),
    password: z.string().min(8),
    termsAccepted: z.boolean().refine(Boolean),
    administrationConsent: z.boolean().refine(Boolean),
    profileType: z.enum(personProfileTypes).default("PERSON"),
    displayName: z.string().trim().min(2).max(120),
    photoDataUrl: photoDataUrlSchema,
    helpMessage: optionalCleanText(500),
    approximateAge: z.preprocess((value) => {
      if (value === "" || value == null) return undefined;
      return value;
    }, z.coerce.number().int().min(0).max(130).optional()),
    criticalInformation: optionalCleanText(700),
    contactName: z.string().trim().min(2).max(120),
    contactPhoneLocal: localChilePhoneSchema,
    contactRelationshipCode: z.enum(contactRelationships).default("MOTHER"),
    contactCallEnabled: z.boolean().default(true),
    contactWhatsappEnabled: z.boolean().default(true),
    contact2Name: z.string().trim().min(2).max(120),
    contact2PhoneLocal: localChilePhoneSchema,
    contact2RelationshipCode: z.enum(contactRelationships).default("FATHER"),
    contact2CallEnabled: z.boolean().default(true),
    contact2WhatsappEnabled: z.boolean().default(true),
    showPhoto: z.boolean().default(true),
    showDisplayName: z.boolean().default(true),
    allowCall: z.boolean().default(true),
    allowWhatsApp: z.boolean().default(true),
    allowLocationSharing: z.boolean().default(true),
    allowFoundReport: z.boolean().default(true),
    showCriticalInformation: z.boolean().default(false),
  })
  .refine((data) => Boolean(data.criticalInformation) || !data.showCriticalInformation, {
    path: ["showCriticalInformation"],
    message: "No se puede mostrar informacion critica vacia.",
  });

export type ActivationInput = z.infer<typeof activationInputSchema>;

export async function validateActivationPublicCode(publicCode: string) {
  const normalizedCode = normalizePublicCode(publicCode);
  if (!normalizedCode) return invalidValidationResponse("");

  const device = await prisma.device.findUnique({
    where: { publicCode: normalizedCode },
    select: { publicCode: true, status: true },
  });

  if (!device) return invalidValidationResponse(normalizedCode);

  const state = getDeviceActivationState(device.status);
  const canActivate = canActivateStatus(device.status);
  if (canActivate) {
    return {
      ok: true,
      reason: null,
      state,
      publicCode: device.publicCode,
    };
  }

  return {
    ok: false,
    reason: state === "ACTIVE" ? ("activated" as const) : ("unavailable" as const),
    state,
    publicCode: device.publicCode,
    ...(state === "ACTIVE"
      ? {
          publicProfileUrl: `/p/${device.publicCode}`,
          managementUrl: `/dashboard/devices/${device.publicCode}`,
        }
      : {}),
  };
}

function invalidValidationResponse(publicCode: string) {
  return {
    ok: false,
    reason: "invalid" as const,
    state: "INVALID" as const,
    publicCode,
  };
}

export async function activateDevice(input: ActivationInput) {
  const publicCode = normalizePublicCode(input.publicCode);
  if (!publicCode) return { ok: false, reason: "invalid" as const };

  const device = await prisma.device.findUnique({ where: { publicCode } });
  if (!device) return { ok: false, reason: "invalid" as const };

  if (!canActivateStatus(device.status)) {
    const activationState = getDeviceActivationState(device.status);
    return { ok: false, reason: activationState === "ACTIVE" ? ("activated" as const) : ("unavailable" as const) };
  }

  if (device.activationBlockedUntil && device.activationBlockedUntil > new Date()) {
    return { ok: false, reason: "blocked" as const };
  }

  const validActivationCode = await verifyActivationCode(input.activationCode, device.activationCodeHash);

  if (!validActivationCode) {
    const attempts = device.activationAttempts + 1;
    await prisma.device.update({
      where: { id: device.id },
      data: {
        activationAttempts: attempts,
        activationBlockedUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : undefined,
      },
    });
    await prisma.activation.create({
      data: {
        deviceId: device.id,
        status: attempts >= 5 ? "BLOCKED" : "PENDING",
        attemptCount: attempts,
      },
    });
    return { ok: false, reason: attempts >= 5 ? ("blocked" as const) : ("invalid" as const) };
  }

  const email = input.email.toLowerCase();
  const ownerPhone = toChilePhone(input.ownerPhoneLocal);
  let user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const passwordMatches = await verifyPassword(input.password, user.passwordHash);
    if (!passwordMatches) return { ok: false, reason: "invalid_user" as const };

    user = await prisma.user.update({
      where: { id: user.id },
      data: { phone: user.phone ?? ownerPhone },
    });
  } else {
    user = await prisma.user.create({
      data: {
        email,
        name: input.ownerName,
        phone: ownerPhone,
        passwordHash: await hashPassword(input.password),
        role: "USER",
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
      },
    });
  }

  const hasCriticalInformation = Boolean(input.criticalInformation);
  const allowCall = input.allowCall;
  const allowWhatsApp = input.allowWhatsApp;
  const processedPhoto = input.photoDataUrl
    ? await processProfilePhotoDataUrl(input.photoDataUrl).catch((error) => {
        if (error instanceof ProfilePhotoError) return null;
        throw error;
      })
    : null;

  if (input.photoDataUrl && !processedPhoto) return { ok: false, reason: "photo_invalid" as const };

  const profile = await prisma.profile.create({
    data: {
      ownerId: user.id,
      type: input.profileType,
      displayName: input.displayName,
      firstName: input.displayName,
      photoUrl: null,
      helpMessage:
        input.helpMessage ??
        "Esta persona usa una pulsera HelPlis. Por favor contacta a su responsable y acompanala en un lugar seguro.",
      approximateAge: input.approximateAge,
      criticalInformation: input.criticalInformation,
      showPhoto: input.showPhoto,
      showDisplayName: input.showDisplayName,
      showAlias: false,
      showFullName: false,
      showContactNames: true,
      showPhoneNumbers: false,
      showAge: false,
      showApproximateAge: false,
      showMedicalInfo: false,
      showBloodType: false,
      showAllergies: false,
      showMedicalConditions: false,
      showMedications: false,
      showMedicalInstructions: false,
      showCommunicationNotes: false,
      showMobilityNotes: false,
      showSensoryNotes: false,
      showGeneralArea: false,
      showExactAddress: false,
      showCriticalInformation: hasCriticalInformation && input.showCriticalInformation,
      showLocationButton: input.allowLocationSharing,
      showWhatsAppButton: input.allowWhatsApp,
      showCallButton: input.allowCall,
      showMessageButton: false,
      allowCall,
      allowWhatsApp,
      allowMessage: false,
      allowLocationSharing: input.allowLocationSharing,
      allowFoundReport: input.allowFoundReport,
      contacts: {
        create: buildActivationContacts(input),
      },
    },
  });

  let storedPhoto: StoredProfilePhoto | null = null;
  if (processedPhoto) {
    try {
      storedPhoto = await storeProcessedProfilePhoto({
        userId: user.id,
        profileId: profile.id,
        photo: processedPhoto,
      });
      await prisma.profile.update({
        where: { id: profile.id },
        data: {
          photoStoragePath: storedPhoto.storagePath,
          photoMimeType: storedPhoto.mimeType,
          photoWidth: storedPhoto.width,
          photoHeight: storedPhoto.height,
          photoSizeBytes: storedPhoto.sizeBytes,
          photoUpdatedAt: storedPhoto.updatedAt,
          photoUrl: null,
        },
      });
    } catch {
      await deletePrivateProfilePhoto(storedPhoto?.storagePath);
      await prisma.profile.delete({ where: { id: profile.id } }).catch(() => null);
      return { ok: false, reason: "photo_storage" as const };
    }
  }

  const activatedAt = new Date();
  await prisma.device.update({
    where: { id: device.id },
    data: {
      status: "ACTIVATED",
      ownerId: user.id,
      profileId: profile.id,
      activatedAt,
      activationCodeUsedAt: activatedAt,
      activationAttempts: 0,
      activationBlockedUntil: null,
    },
  });

  await prisma.activation.create({
    data: {
      deviceId: device.id,
      userId: user.id,
      status: "COMPLETED",
      completedAt: activatedAt,
      attemptCount: 1,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "DEVICE_ACTIVATED",
      entityType: "Device",
      entityId: device.id,
      newData: JSON.stringify({ publicCode, profileId: profile.id, peopleFirst: true }),
    },
  });

  await notificationProvider.sendLocal({
    userId: user.id,
    deviceId: device.id,
    profileId: profile.id,
    eventType: "ACTIVATION_COMPLETED",
    payload: { publicCode },
  });

  return { ok: true, user, profile, publicCode };
}

function buildActivationContacts(input: ActivationInput) {
  return [
    {
      type: "PRIMARY" as const,
      name: input.contactName,
      phone: toChilePhone(input.contactPhoneLocal),
      relationship: relationshipLabel(input.contactRelationshipCode),
      relationshipCode: input.contactRelationshipCode,
      priority: 1,
      whatsappEnabled: input.allowWhatsApp && input.contactWhatsappEnabled,
      callEnabled: input.allowCall && input.contactCallEnabled,
    },
    {
      type: "SECONDARY" as const,
      name: input.contact2Name,
      phone: toChilePhone(input.contact2PhoneLocal),
      relationship: relationshipLabel(input.contact2RelationshipCode),
      relationshipCode: input.contact2RelationshipCode,
      priority: 2,
      whatsappEnabled: input.allowWhatsApp && input.contact2WhatsappEnabled,
      callEnabled: input.allowCall && input.contact2CallEnabled,
    },
  ].map((contact) => ({
    ...contact,
    isVisible: true,
    messageEnabled: false,
  }));
}

function normalizePublicCode(value: string) {
  const normalized = value.trim().toUpperCase();
  return /^[A-Z0-9]{4,12}$/.test(normalized) ? normalized : null;
}

function toChilePhone(localDigits: string) {
  return `+569${localDigits}`;
}

function relationshipLabel(value: ActivationInput["contactRelationshipCode"]) {
  const labels: Record<ActivationInput["contactRelationshipCode"], string> = {
    MOTHER: "Mama",
    FATHER: "Papa",
    FAMILY: "Familiar",
    RESPONSIBLE: "Responsable",
  };
  return labels[value];
}
