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
    contactName: formData.get("contactName"),
    contactPhone: formData.get("contactPhone"),
    specialInstructions: formData.get("specialInstructions") || undefined,
    showMedicalInfo: parseBooleanFormValue(formData.get("showMedicalInfo")),
    showContactNames: parseBooleanFormValue(formData.get("showContactNames")),
    showPhoneNumbers: parseBooleanFormValue(formData.get("showPhoneNumbers")),
    showLocationButton: parseBooleanFormValue(formData.get("showLocationButton")),
    showWhatsAppButton: parseBooleanFormValue(formData.get("showWhatsAppButton")),
    showCallButton: parseBooleanFormValue(formData.get("showCallButton")),
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
