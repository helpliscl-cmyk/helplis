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
    "PET",
    "LUGGAGE",
    "OBJECT",
    "ASSET",
    "EMPLOYEE",
    "OTHER",
  ]),
  displayName: z.string().min(2),
  alias: z.string().optional(),
  specialInstructions: z.string().optional(),
  medicalNotes: z.string().optional(),
  allergies: z.string().optional(),
  medications: z.string().optional(),
});

export async function createProfileAction(formData: FormData) {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({
    type: formData.get("type"),
    displayName: formData.get("displayName"),
    alias: formData.get("alias") || undefined,
    specialInstructions: formData.get("specialInstructions") || undefined,
    medicalNotes: formData.get("medicalNotes") || undefined,
    allergies: formData.get("allergies") || undefined,
    medications: formData.get("medications") || undefined,
  });
  if (!parsed.success) redirect("/dashboard/profiles?error=invalid");

  await prisma.profile.create({
    data: {
      ownerId: user.id,
      ...parsed.data,
      showPhoto: true,
      showAlias: true,
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
      allowMessage: true,
      allowLocationSharing: true,
      allowFoundReport: true,
      showMedicalInfo: Boolean(parsed.data.medicalNotes || parsed.data.allergies || parsed.data.medications),
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
      showFullName: parseBooleanFormValue(formData.get("showFullName")),
      showAlias: parseBooleanFormValue(formData.get("showAlias")),
      showMedicalInfo: parseBooleanFormValue(formData.get("showMedicalInfo")),
      showContactNames: parseBooleanFormValue(formData.get("showContactNames")),
      showPhoneNumbers: parseBooleanFormValue(formData.get("showPhoneNumbers")),
      showAge: parseBooleanFormValue(formData.get("showAge")),
      showApproximateAge: parseBooleanFormValue(formData.get("showApproximateAge")),
      showBloodType: parseBooleanFormValue(formData.get("showBloodType")),
      showAllergies: parseBooleanFormValue(formData.get("showAllergies")),
      showMedicalConditions: parseBooleanFormValue(formData.get("showMedicalConditions")),
      showMedications: parseBooleanFormValue(formData.get("showMedications")),
      showMedicalInstructions: parseBooleanFormValue(formData.get("showMedicalInstructions")),
      showCommunicationNotes: parseBooleanFormValue(formData.get("showCommunicationNotes")),
      showMobilityNotes: parseBooleanFormValue(formData.get("showMobilityNotes")),
      showSensoryNotes: parseBooleanFormValue(formData.get("showSensoryNotes")),
      showGeneralArea: parseBooleanFormValue(formData.get("showGeneralArea")),
      showExactAddress: parseBooleanFormValue(formData.get("showExactAddress")),
      showLocationButton: parseBooleanFormValue(formData.get("showLocationButton")),
      showWhatsAppButton: parseBooleanFormValue(formData.get("showWhatsAppButton")),
      showCallButton: parseBooleanFormValue(formData.get("showCallButton")),
      showMessageButton: parseBooleanFormValue(formData.get("showMessageButton")),
      allowCall: parseBooleanFormValue(formData.get("allowCall")),
      allowWhatsApp: parseBooleanFormValue(formData.get("allowWhatsApp")),
      allowMessage: parseBooleanFormValue(formData.get("allowMessage")),
      allowLocationSharing: parseBooleanFormValue(formData.get("allowLocationSharing")),
      allowFoundReport: parseBooleanFormValue(formData.get("allowFoundReport")),
      isPublic: parseBooleanFormValue(formData.get("isPublic")),
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
