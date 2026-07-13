"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { parseBooleanFormValue } from "@/lib/formatting/format";
import { prisma } from "@/server/db/client";
import { notificationProvider } from "@/server/notifications/provider";
import { getDeviceWithManagePermission } from "@/server/services/device-access";
import { getDeviceActivationState } from "@/server/services/device-rules";
import {
  deletePrivateProfilePhoto,
  processProfilePhotoBuffer,
  ProfilePhotoError,
  storeProcessedProfilePhoto,
} from "@/server/services/profile-photo-storage";

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

const reassignmentProfileSchema = z.object({
  type: z.enum(["PERSON", "CHILD", "SENIOR", "DEPENDENT_PERSON", "MEDICAL_PROFILE"]).default("PERSON"),
  displayName: z.string().trim().min(2).max(120),
  helpMessage: z.string().trim().max(500).optional(),
  criticalInformation: z.string().trim().max(700).optional(),
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

export async function updateProfilePhotoAction(formData: FormData) {
  const user = await requireUser();
  const profileId = String(formData.get("profileId") ?? "");
  const uploaded = formData.get("photo");
  if (!(uploaded instanceof File) || uploaded.size <= 0) redirect("/dashboard/profiles?error=photo");

  const profile = await prisma.profile.findFirst({
    where: { id: profileId, ownerId: user.id, deletedAt: null },
    select: {
      id: true,
      ownerId: true,
      photoStoragePath: true,
      photoMimeType: true,
      photoWidth: true,
      photoHeight: true,
      photoSizeBytes: true,
    },
  });
  if (!profile?.ownerId) redirect("/dashboard/profiles?error=forbidden");

  const previousPath = profile.photoStoragePath;
  const processedPhoto = await processProfilePhotoBuffer(uploaded.type, Buffer.from(await uploaded.arrayBuffer())).catch(
    (error) => {
      if (error instanceof ProfilePhotoError) return null;
      throw error;
    },
  );
  if (!processedPhoto) redirect("/dashboard/profiles?error=photo");

  const storedPhoto = await storeProcessedProfilePhoto({
    userId: profile.ownerId,
    profileId: profile.id,
    photo: processedPhoto,
  });

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      photoUrl: null,
      photoStoragePath: storedPhoto.storagePath,
      photoMimeType: storedPhoto.mimeType,
      photoWidth: storedPhoto.width,
      photoHeight: storedPhoto.height,
      photoSizeBytes: storedPhoto.sizeBytes,
      photoUpdatedAt: storedPhoto.updatedAt,
      showPhoto: true,
    },
  });
  await deletePrivateProfilePhoto(previousPath);
  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: previousPath ? "PROFILE_PHOTO_REPLACED" : "PROFILE_PHOTO_UPLOADED",
      entityType: "Profile",
      entityId: profile.id,
      previousData: JSON.stringify({
        photoStoragePath: previousPath,
        photoMimeType: profile.photoMimeType,
        photoWidth: profile.photoWidth,
        photoHeight: profile.photoHeight,
        photoSizeBytes: profile.photoSizeBytes,
      }),
      newData: JSON.stringify({
        photoStoragePath: storedPhoto.storagePath,
        photoMimeType: storedPhoto.mimeType,
        photoWidth: storedPhoto.width,
        photoHeight: storedPhoto.height,
        photoSizeBytes: storedPhoto.sizeBytes,
        photoUpdatedAt: storedPhoto.updatedAt.toISOString(),
      }),
    },
  });

  redirect("/dashboard/profiles?photo=updated");
}

export async function deleteProfilePhotoAction(formData: FormData) {
  const user = await requireUser();
  const profileId = String(formData.get("profileId") ?? "");
  const profile = await prisma.profile.findFirst({
    where: { id: profileId, ownerId: user.id, deletedAt: null },
    select: { id: true, photoStoragePath: true },
  });
  if (!profile) redirect("/dashboard/profiles?error=forbidden");

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      photoUrl: null,
      photoStoragePath: null,
      photoMimeType: null,
      photoWidth: null,
      photoHeight: null,
      photoSizeBytes: null,
      photoUpdatedAt: null,
      showPhoto: false,
    },
  });
  await deletePrivateProfilePhoto(profile.photoStoragePath);
  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "PROFILE_PHOTO_DELETED",
      entityType: "Profile",
      entityId: profile.id,
      previousData: JSON.stringify({ photoStoragePath: profile.photoStoragePath }),
      newData: JSON.stringify({ photoStoragePath: null, showPhoto: false }),
    },
  });

  redirect("/dashboard/profiles?photo=deleted");
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

export async function reassignDeviceProfileAction(formData: FormData) {
  const user = await requireUser();
  const deviceId = String(formData.get("deviceId") ?? "");
  const assignmentMode = String(formData.get("assignmentMode") ?? "");
  const confirmed = parseBooleanFormValue(formData.get("confirmReassign"));
  const reassignmentReason =
    String(formData.get("reassignmentReason") ?? "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 300) || null;

  const device = await getDeviceWithManagePermission(user, deviceId);
  if (!device) redirect("/dashboard/devices?error=forbidden");
  if (getDeviceActivationState(device.status) !== "ACTIVE") {
    redirect(`/dashboard/devices/${device.publicCode}?error=invalid_state`);
  }
  if (!confirmed) redirect(`/dashboard/devices/${device.publicCode}?error=confirmation_required`);

  const profileOwnerId = device.ownerId ?? user.id;
  const previousSnapshot = {
    publicCode: device.publicCode,
    nfcUid: device.nfcUid,
    qrContent: device.qrContent,
    nfcContent: device.nfcContent,
    status: device.status,
    ownerId: device.ownerId,
    profileId: device.profileId,
  };

  let nextProfileId: string;

  if (assignmentMode === "existing") {
    const profileId = String(formData.get("profileId") ?? "");
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, ownerId: profileOwnerId, deletedAt: null },
      select: { id: true },
    });
    if (!profile) redirect(`/dashboard/devices/${device.publicCode}?error=profile_forbidden`);
    nextProfileId = profile.id;
  } else if (assignmentMode === "new") {
    const parsed = reassignmentProfileSchema.safeParse({
      type: formData.get("type") || "PERSON",
      displayName: formData.get("displayName"),
      helpMessage: formData.get("helpMessage") || undefined,
      criticalInformation: formData.get("criticalInformation") || undefined,
    });
    if (!parsed.success) redirect(`/dashboard/devices/${device.publicCode}?error=invalid_profile`);

    const profile = await prisma.profile.create({
      data: {
        ownerId: profileOwnerId,
        ...parsed.data,
        firstName: parsed.data.displayName,
        showPhoto: true,
        showDisplayName: true,
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
        showCriticalInformation: false,
        showLocationButton: true,
        showWhatsAppButton: true,
        showCallButton: true,
        showMessageButton: false,
        allowCall: true,
        allowWhatsApp: true,
        allowMessage: false,
        allowLocationSharing: true,
        allowFoundReport: true,
      },
      select: { id: true },
    });
    nextProfileId = profile.id;
  } else {
    redirect(`/dashboard/devices/${device.publicCode}?error=invalid`);
  }

  if (nextProfileId === device.profileId) redirect(`/dashboard/devices/${device.publicCode}?error=same_profile`);

  const reassignedAt = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.device.update({
      where: { id: device.id },
      data: {
        profileId: nextProfileId,
        status: "ACTIVATED",
        activatedAt: device.activatedAt ?? reassignedAt,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: user.id,
        action: "DEVICE_PROFILE_REASSIGNED",
        entityType: "Device",
        entityId: device.id,
        previousData: JSON.stringify(previousSnapshot),
        newData: JSON.stringify({
          publicCode: device.publicCode,
          nfcUid: device.nfcUid,
          qrContent: device.qrContent,
          nfcContent: device.nfcContent,
          ownerId: device.ownerId,
          previousProfileId: device.profileId,
          profileId: nextProfileId,
          status: "ACTIVATED",
          reassignedAt: reassignedAt.toISOString(),
          actorUserId: user.id,
          reason: reassignmentReason,
        }),
      },
    });
  });

  await notificationProvider.sendLocal({
    userId: device.ownerId,
    deviceId: device.id,
    profileId: nextProfileId,
    eventType: "PROFILE_UPDATED",
    payload: {
      publicCode: device.publicCode,
      previousProfileId: device.profileId,
      profileId: nextProfileId,
      reassigned: true,
      reason: reassignmentReason,
    },
  });

  redirect(`/dashboard/devices/${device.publicCode}?reassigned=1`);
}
