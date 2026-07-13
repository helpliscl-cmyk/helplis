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
  alias: z.string().max(80).optional(),
  helpMessage: z.string().max(500).optional(),
  description: z.string().max(700).optional(),
  approximateAge: z.coerce.number().int().min(0).max(130).optional(),
  communicationNotes: z.string().max(500).optional(),
  mobilityNotes: z.string().max(500).optional(),
  sensoryNotes: z.string().max(500).optional(),
  allergies: z.string().max(500).optional(),
  medicalConditions: z.string().max(500).optional(),
  medications: z.string().max(500).optional(),
  bloodType: z.string().max(8).optional(),
  medicalInstructions: z.string().max(500).optional(),
  commune: z.string().max(120).optional(),
  generalArea: z.string().max(180).optional(),
  petName: z.string().max(120).optional(),
  species: z.string().max(80).optional(),
  breed: z.string().max(120).optional(),
  color: z.string().max(80).optional(),
  veterinaryNotes: z.string().max(500).optional(),
  petBehaviorNotes: z.string().max(500).optional(),
  objectName: z.string().max(120).optional(),
  objectCategory: z.string().max(120).optional(),
  brand: z.string().max(120).optional(),
  model: z.string().max(120).optional(),
  returnInstructions: z.string().max(500).optional(),
  rewardMessage: z.string().max(300).optional(),
  contactName: z.string().min(2),
  contactPhone: z.string().min(7),
  contactRelationship: z.string().max(80).optional(),
  contactAvailabilityNotes: z.string().max(180).optional(),
  contact2Name: z.string().max(120).optional(),
  contact2Phone: z.string().max(32).optional(),
  contact2Relationship: z.string().max(80).optional(),
  contact2AvailabilityNotes: z.string().max(180).optional(),
  contact3Name: z.string().max(120).optional(),
  contact3Phone: z.string().max(32).optional(),
  contact3Relationship: z.string().max(80).optional(),
  contact3AvailabilityNotes: z.string().max(180).optional(),
  specialInstructions: z.string().optional(),
  showPhoto: z.boolean().default(true),
  showAlias: z.boolean().default(true),
  showFullName: z.boolean().default(false),
  showMedicalInfo: z.boolean().default(false),
  showContactNames: z.boolean().default(true),
  showPhoneNumbers: z.boolean().default(false),
  showApproximateAge: z.boolean().default(false),
  showBloodType: z.boolean().default(false),
  showAllergies: z.boolean().default(false),
  showMedicalConditions: z.boolean().default(false),
  showMedications: z.boolean().default(false),
  showMedicalInstructions: z.boolean().default(false),
  showCommunicationNotes: z.boolean().default(false),
  showMobilityNotes: z.boolean().default(false),
  showSensoryNotes: z.boolean().default(false),
  showGeneralArea: z.boolean().default(false),
  showLocationButton: z.boolean().default(true),
  showWhatsAppButton: z.boolean().default(true),
  showCallButton: z.boolean().default(true),
  showMessageButton: z.boolean().default(true),
  allowFoundReport: z.boolean().default(true),
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
      alias: input.alias,
      helpMessage: input.helpMessage,
      description: input.description,
      approximateAge: input.approximateAge,
      communicationNotes: input.communicationNotes,
      mobilityNotes: input.mobilityNotes,
      sensoryNotes: input.sensoryNotes,
      allergies: input.allergies,
      medicalConditions: input.medicalConditions,
      medications: input.medications,
      bloodType: input.bloodType,
      medicalInstructions: input.medicalInstructions,
      commune: input.commune,
      generalArea: input.generalArea,
      petName: input.petName,
      species: input.species,
      breed: input.breed,
      color: input.color,
      veterinaryNotes: input.veterinaryNotes,
      petBehaviorNotes: input.petBehaviorNotes,
      objectName: input.objectName,
      objectCategory: input.objectCategory,
      brand: input.brand,
      model: input.model,
      returnInstructions: input.returnInstructions,
      rewardMessage: input.rewardMessage,
      specialInstructions: input.specialInstructions,
      showPhoto: input.showPhoto,
      showAlias: input.showAlias,
      showFullName: input.showFullName,
      showMedicalInfo: input.showMedicalInfo,
      showContactNames: input.showContactNames,
      showPhoneNumbers: input.showPhoneNumbers,
      showApproximateAge: input.showApproximateAge,
      showBloodType: input.showBloodType,
      showAllergies: input.showAllergies,
      showMedicalConditions: input.showMedicalConditions,
      showMedications: input.showMedications,
      showMedicalInstructions: input.showMedicalInstructions,
      showCommunicationNotes: input.showCommunicationNotes,
      showMobilityNotes: input.showMobilityNotes,
      showSensoryNotes: input.showSensoryNotes,
      showGeneralArea: input.showGeneralArea,
      showExactAddress: false,
      showLocationButton: input.showLocationButton,
      showWhatsAppButton: input.showWhatsAppButton,
      showCallButton: input.showCallButton,
      showMessageButton: input.showMessageButton,
      allowCall: input.showCallButton,
      allowWhatsApp: input.showWhatsAppButton,
      allowMessage: input.showMessageButton,
      allowLocationSharing: input.showLocationButton,
      allowFoundReport: input.allowFoundReport,
      contacts: {
        create: buildActivationContacts(input),
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

function buildActivationContacts(input: ActivationInput) {
  const rawContacts = [
    {
      name: input.contactName,
      phone: input.contactPhone,
      relationship: input.contactRelationship || "Contacto principal",
      availabilityNotes: input.contactAvailabilityNotes,
    },
    {
      name: input.contact2Name,
      phone: input.contact2Phone,
      relationship: input.contact2Relationship,
      availabilityNotes: input.contact2AvailabilityNotes,
    },
    {
      name: input.contact3Name,
      phone: input.contact3Phone,
      relationship: input.contact3Relationship,
      availabilityNotes: input.contact3AvailabilityNotes,
    },
  ];

  return rawContacts
    .filter((contact) => Boolean(contact.name && contact.phone))
    .map((contact, index) => ({
      name: contact.name!,
      phone: contact.phone!,
      relationship: contact.relationship,
      availabilityNotes: contact.availabilityNotes,
      priority: index + 1,
      isVisible: true,
      whatsappEnabled: input.showWhatsAppButton,
      callEnabled: input.showCallButton,
      messageEnabled: input.showMessageButton,
    }));
}
