"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { parseBooleanFormValue } from "@/lib/formatting/format";
import { activateDevice, activationInputSchema } from "@/server/services/activation";

export async function activateDeviceAction(formData: FormData) {
  const parsed = activationInputSchema.safeParse({
    publicCode: formData.get("publicCode"),
    activationCode: formData.get("activationCode"),
    ownerName: formData.get("ownerName"),
    ownerPhoneLocal: formData.get("ownerPhoneLocal"),
    email: formData.get("email"),
    password: formData.get("password"),
    termsAccepted: parseBooleanFormValue(formData.get("termsAccepted")),
    administrationConsent: parseBooleanFormValue(formData.get("administrationConsent")),
    profileType: formData.get("profileType"),
    displayName: formData.get("displayName"),
    photoDataUrl: formData.get("photoDataUrl") || undefined,
    helpMessage: formData.get("helpMessage") || undefined,
    approximateAge: formData.get("approximateAge") || undefined,
    criticalInformation: formData.get("criticalInformation") || undefined,
    contactName: formData.get("contactName"),
    contactPhoneLocal: formData.get("contactPhoneLocal"),
    contactRelationshipCode: formData.get("contactRelationshipCode"),
    contactCallEnabled: parseBooleanFormValue(formData.get("contactCallEnabled")),
    contactWhatsappEnabled: parseBooleanFormValue(formData.get("contactWhatsappEnabled")),
    contact2Name: formData.get("contact2Name"),
    contact2PhoneLocal: formData.get("contact2PhoneLocal"),
    contact2RelationshipCode: formData.get("contact2RelationshipCode"),
    contact2CallEnabled: parseBooleanFormValue(formData.get("contact2CallEnabled")),
    contact2WhatsappEnabled: parseBooleanFormValue(formData.get("contact2WhatsappEnabled")),
    showPhoto: parseBooleanFormValue(formData.get("showPhoto")),
    showDisplayName: parseBooleanFormValue(formData.get("showDisplayName")),
    allowCall: parseBooleanFormValue(formData.get("allowCall")),
    allowWhatsApp: parseBooleanFormValue(formData.get("allowWhatsApp")),
    allowLocationSharing: parseBooleanFormValue(formData.get("allowLocationSharing")),
    allowFoundReport: parseBooleanFormValue(formData.get("allowFoundReport")),
    showCriticalInformation: parseBooleanFormValue(formData.get("showCriticalInformation")),
  });

  if (!parsed.success) redirect("/activate?error=invalid");

  const result = await activateDevice(parsed.data);
  if (result.ok === false) redirect(`/activate/${parsed.data.publicCode}?error=${result.reason}`);
  if (!result.user) redirect(`/activate/${parsed.data.publicCode}?error=invalid`);

  const session = await getSession();
  session.user = {
    id: result.user.id,
    email: result.user.email,
    name: result.user.name,
    role: result.user.role,
  };
  await session.save();

  redirect(`/dashboard/devices?activated=${result.publicCode}`);
}
