import { z } from "zod";
import { hashPassword, verifyActivationCode, verifyPassword } from "@/lib/security/hashing";
import { prisma } from "@/server/db/client";
import { notificationProvider } from "@/server/notifications/provider";

export const activationInputSchema = z.object({
  publicCode: z.string().min(4).max(12),
  activationCode: z.string().min(6).max(32),
  email: z.string().email(),
  password: z.string().min(8),
  ownerName: z.string().min(2),
  profileType: z.enum([
    "PERSON",
    "CHILD",
    "SENIOR",
    "DEPENDENT_PERSON",
    "MEDICAL_PROFILE",
    "PET",
    "LUGGAGE",
    "OBJECT",
    "ASSET",
    "EMPLOYEE",
    "OTHER",
  ]),
  displayName: z.string().min(2),
  contactName: z.string().min(2),
  contactPhone: z.string().min(7),
  specialInstructions: z.string().optional(),
  showMedicalInfo: z.boolean().default(false),
  showContactNames: z.boolean().default(true),
  showPhoneNumbers: z.boolean().default(true),
  showLocationButton: z.boolean().default(true),
  showWhatsAppButton: z.boolean().default(true),
  showCallButton: z.boolean().default(true),
});

export type ActivationInput = z.infer<typeof activationInputSchema>;

export async function activateDevice(input: ActivationInput) {
  const publicCode = input.publicCode.trim().toUpperCase();
  const device = await prisma.device.findUnique({ where: { publicCode } });
  if (!device) return { ok: false, reason: "invalid" as const };

  if (!["AVAILABLE", "UNASSIGNED", "RESERVED"].includes(device.status)) {
    return { ok: false, reason: "unavailable" as const };
  }

  if (device.activationBlockedUntil && device.activationBlockedUntil > new Date()) {
    return { ok: false, reason: "blocked" as const };
  }

  const validActivationCode = await verifyActivationCode(
    input.activationCode,
    device.activationCodeHash,
  );

  if (!validActivationCode) {
    const attempts = device.activationAttempts + 1;
    await prisma.device.update({
      where: { id: device.id },
      data: {
        activationAttempts: attempts,
        activationBlockedUntil:
          attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : undefined,
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
  let user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const passwordMatches = await verifyPassword(input.password, user.passwordHash);
    if (!passwordMatches) return { ok: false, reason: "invalid_user" as const };
  } else {
    user = await prisma.user.create({
      data: {
        email,
        name: input.ownerName,
        passwordHash: await hashPassword(input.password),
        role: "USER",
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
      },
    });
  }

  const profile = await prisma.profile.create({
    data: {
      ownerId: user.id,
      type: input.profileType,
      displayName: input.displayName,
      specialInstructions: input.specialInstructions,
      showMedicalInfo: input.showMedicalInfo,
      showContactNames: input.showContactNames,
      showPhoneNumbers: input.showPhoneNumbers,
      showLocationButton: input.showLocationButton,
      showWhatsAppButton: input.showWhatsAppButton,
      showCallButton: input.showCallButton,
      contacts: {
        create: {
          name: input.contactName,
          phone: input.contactPhone,
          relationship: "Contacto principal",
          priority: 1,
          isVisible: true,
          whatsappEnabled: input.showWhatsAppButton,
          callEnabled: input.showCallButton,
          messageEnabled: true,
        },
      },
    },
  });

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
      newData: JSON.stringify({ publicCode, profileId: profile.id }),
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
