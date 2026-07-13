"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { parseBooleanFormValue } from "@/lib/formatting/format";
import { activateDevice, activationInputSchema } from "@/server/services/activation";

export async function activateDeviceAction(formData: FormData) {
  const parsed = activationInputSchema.safeParse({
    publicCode: formData.get("publicCode"),
    activationCode: formData.get("activationCode"),
    email: formData.get("email"),
    password: formData.get("password"),
    ownerName: formData.get("ownerName"),
    profileType: formData.get("profileType"),
    displayName: formData.get("displayName"),
    alias: formData.get("alias") || undefined,
    helpMessage: formData.get("helpMessage") || undefined,
    description: formData.get("description") || undefined,
    approximateAge: formData.get("approximateAge") || undefined,
    communicationNotes: formData.get("communicationNotes") || undefined,
    mobilityNotes: formData.get("mobilityNotes") || undefined,
    sensoryNotes: formData.get("sensoryNotes") || undefined,
    allergies: formData.get("allergies") || undefined,
    medicalConditions: formData.get("medicalConditions") || undefined,
    medications: formData.get("medications") || undefined,
    bloodType: formData.get("bloodType") || undefined,
    medicalInstructions: formData.get("medicalInstructions") || undefined,
    commune: formData.get("commune") || undefined,
    generalArea: formData.get("generalArea") || undefined,
    petName: formData.get("petName") || undefined,
    species: formData.get("species") || undefined,
    breed: formData.get("breed") || undefined,
    color: formData.get("color") || undefined,
    veterinaryNotes: formData.get("veterinaryNotes") || undefined,
    petBehaviorNotes: formData.get("petBehaviorNotes") || undefined,
    objectName: formData.get("objectName") || undefined,
    objectCategory: formData.get("objectCategory") || undefined,
    brand: formData.get("brand") || undefined,
    model: formData.get("model") || undefined,
    returnInstructions: formData.get("returnInstructions") || undefined,
    rewardMessage: formData.get("rewardMessage") || undefined,
    contactName: formData.get("contactName"),
    contactPhone: formData.get("contactPhone"),
    contactRelationship: formData.get("contactRelationship") || undefined,
    contactAvailabilityNotes: formData.get("contactAvailabilityNotes") || undefined,
    contact2Name: formData.get("contact2Name") || undefined,
    contact2Phone: formData.get("contact2Phone") || undefined,
    contact2Relationship: formData.get("contact2Relationship") || undefined,
    contact2AvailabilityNotes: formData.get("contact2AvailabilityNotes") || undefined,
    contact3Name: formData.get("contact3Name") || undefined,
    contact3Phone: formData.get("contact3Phone") || undefined,
    contact3Relationship: formData.get("contact3Relationship") || undefined,
    contact3AvailabilityNotes: formData.get("contact3AvailabilityNotes") || undefined,
    specialInstructions: formData.get("specialInstructions") || undefined,
    showPhoto: parseBooleanFormValue(formData.get("showPhoto")),
    showAlias: parseBooleanFormValue(formData.get("showAlias")),
    showFullName: parseBooleanFormValue(formData.get("showFullName")),
    showMedicalInfo: parseBooleanFormValue(formData.get("showMedicalInfo")),
    showContactNames: parseBooleanFormValue(formData.get("showContactNames")),
    showPhoneNumbers: parseBooleanFormValue(formData.get("showPhoneNumbers")),
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
    showLocationButton: parseBooleanFormValue(formData.get("showLocationButton")),
    showWhatsAppButton: parseBooleanFormValue(formData.get("showWhatsAppButton")),
    showCallButton: parseBooleanFormValue(formData.get("showCallButton")),
    showMessageButton: parseBooleanFormValue(formData.get("showMessageButton")),
    allowFoundReport: parseBooleanFormValue(formData.get("allowFoundReport")),
  });

  if (!parsed.success) redirect("/activate?error=invalid");

  const result = await activateDevice(parsed.data);
  if (result.ok === false) redirect(`/activate/${parsed.data.publicCode}?error=${result.reason}`);
  if (!result.user) redirect(`/activate/${parsed.data.publicCode}?error=invalid`);
  const activatedUser = result.user;

  const session = await getSession();
  session.user = {
    id: activatedUser.id,
    email: activatedUser.email,
    name: activatedUser.name,
    role: activatedUser.role,
  };
  await session.save();

  redirect(`/dashboard/devices?activated=${result.publicCode}`);
}
