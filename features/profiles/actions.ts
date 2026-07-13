"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { parseBooleanFormValue } from "@/lib/formatting/format";
import { prisma } from "@/server/db/client";
import { notificationProvider } from "@/server/notifications/provider";

const profileSchema = z.object({
  type: z.enum([
    "PERSON",
    "CHILD",
    "SENIOR",
    "DEPENDENT_PERSON",
    "MEDICAL_PROFILE",
  ]),
  displayName: z.string().min(2),
  helpMessage: z.string().max(500).optional(),
  criticalInformation: z.string().max(700).optional(),
});

export async function createProfileAction(formData: FormData) {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({
    type: formData.get("type"),
    displayName: formData.get("displayName"),
    helpMessage: formData.get("helpMessage") || undefined,
    criticalInformation: formData.get("criticalInformation") || undefined,
  });
  if (!parsed.success) redirect("/dashboard/profiles?error=invalid");

  await prisma.profile.create({
    data: {
      ownerId: user.id,
      ...parsed.data,
      showPhoto: true,
      showDisplayName: true,
      showAlias: false,
      showFullName: false,
      showPhoneNumbers: false,
      showApproximateAge: false,
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
      allowCall: true,
      allowWhatsApp: true,
      allowMessage: false,
      allowLocationSharing: true,
      allowFoundReport: true,
      showMessageButton: false,
      showCriticalInformation: false,
      showMedicalInfo: false,
    },
  });
  redirect("/dashboard/profiles?created=1");
}

export async function createContactAction(formData: FormData) {
  const user = await requireUser();
  const profileId = String(formData.get("profileId") ?? "");
  const profile = await prisma.profile.findFirst({ where: { id: profileId, ownerId: user.id } });
  if (!profile) redirect("/dashboard/contacts?error=forbidden");

  await prisma.emergencyContact.create({
    data: {
      profileId,
      name: String(formData.get("name") ?? ""),
      relationship: String(formData.get("relationship") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? "") || null,
      whatsappEnabled: parseBooleanFormValue(formData.get("whatsappEnabled")),
      callEnabled: parseBooleanFormValue(formData.get("callEnabled")),
      messageEnabled: parseBooleanFormValue(formData.get("messageEnabled")),
      isVisible: true,
    },
  });
  redirect("/dashboard/contacts?created=1");
}

export async function updatePrivacyAction(formData: FormData) {
  const user = await requireUser();
  const profileId = String(formData.get("profileId") ?? "");
  const profile = await prisma.profile.findFirst({ where: { id: profileId, ownerId: user.id } });
  if (!profile) redirect("/dashboard/privacy?error=forbidden");

  await prisma.profile.update({
    where: { id: profileId },
    data: {
      showPhoto: parseBooleanFormValue(formData.get("showPhoto")),
      showDisplayName: parseBooleanFormValue(formData.get("showDisplayName")),
      showFullName: false,
      showAlias: false,
      showContactNames: true,
      showPhoneNumbers: false,
      showAge: false,
      showApproximateAge: false,
      showGeneralArea: false,
      showLocationButton: parseBooleanFormValue(formData.get("allowLocationSharing")),
      showWhatsAppButton: parseBooleanFormValue(formData.get("allowWhatsApp")),
      showCallButton: parseBooleanFormValue(formData.get("allowCall")),
      showMessageButton: false,
      allowCall: parseBooleanFormValue(formData.get("allowCall")),
      allowWhatsApp: parseBooleanFormValue(formData.get("allowWhatsApp")),
      allowMessage: false,
      allowLocationSharing: parseBooleanFormValue(formData.get("allowLocationSharing")),
      allowFoundReport: parseBooleanFormValue(formData.get("allowFoundReport")),
      showCriticalInformation:
        Boolean(profile.criticalInformation) && parseBooleanFormValue(formData.get("showCriticalInformation")),
      isPublic: parseBooleanFormValue(formData.get("isPublic")),
      showMedicalInfo: false,
      showBloodType: false,
      showAllergies: false,
      showMedicalConditions: false,
      showMedications: false,
      showMedicalInstructions: false,
      showCommunicationNotes: false,
      showMobilityNotes: false,
      showSensoryNotes: false,
      showExactAddress: false,
    },
  });

  await notificationProvider.sendLocal({
    userId: user.id,
    profileId,
    eventType: "PROFILE_UPDATED",
    payload: { profileId },
  });

  redirect("/dashboard/privacy?saved=1");
}

export async function updateDeviceStatusAction(formData: FormData) {
  const user = await requireUser();
  const deviceId = String(formData.get("deviceId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["LOST", "FOUND", "ACTIVATED"].includes(status)) redirect("/dashboard/devices?error=invalid");

  const device = await prisma.device.findFirst({ where: { id: deviceId, ownerId: user.id } });
  if (!device) redirect("/dashboard/devices?error=forbidden");

  await prisma.device.update({
    where: { id: deviceId },
    data: {
      status: status as "LOST" | "FOUND" | "ACTIVATED",
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: status === "LOST" ? "DEVICE_MARKED_LOST" : "DEVICE_STATUS_UPDATED",
      entityType: "Device",
      entityId: deviceId,
      newData: JSON.stringify({ status }),
    },
  });

  await notificationProvider.sendLocal({
    userId: user.id,
    deviceId,
    profileId: device.profileId,
    eventType: status === "LOST" ? "DEVICE_MARKED_LOST" : "MARKED_AS_FOUND",
    payload: { publicCode: device.publicCode, status },
  });

  redirect("/dashboard/devices?status=updated");
}
