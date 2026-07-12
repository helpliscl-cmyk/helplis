"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { completePacking, releaseOrderDevices, reserveDevicesForOrder } from "@/server/operations/fulfillment";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function reserveOrderDevicesAction(formData: FormData) {
  const user = await requireRole(["ADMIN", "SUPER_ADMIN", "SUPPORT"]);
  const orderId = text(formData, "orderId");
  await reserveDevicesForOrder(orderId, user.id);
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/admin/orders/${orderId}?reserved=1`);
}

export async function releaseOrderDevicesAction(formData: FormData) {
  const user = await requireRole(["ADMIN", "SUPER_ADMIN", "SUPPORT"]);
  const orderId = text(formData, "orderId");
  await releaseOrderDevices(orderId, user.id);
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/admin/orders/${orderId}?released=1`);
}

export async function completePackingAction(formData: FormData) {
  const user = await requireRole(["ADMIN", "SUPER_ADMIN", "SUPPORT"]);
  const orderId = text(formData, "orderId");
  await completePacking(
    orderId,
    {
      quantityCorrect: formData.get("quantityCorrect") === "on",
      verifiedDevices: formData.get("verifiedDevices") === "on",
      qrChecked: formData.get("qrChecked") === "on",
      nfcChecked: formData.get("nfcChecked") === "on",
      activationCodesChecked: formData.get("activationCodesChecked") === "on",
      cardsIncluded: formData.get("cardsIncluded") === "on",
      packageClosed: formData.get("packageClosed") === "on",
      addressConfirmed: formData.get("addressConfirmed") === "on",
      paymentConfirmed: formData.get("paymentConfirmed") === "on",
    },
    user.id,
  );
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/admin/orders/${orderId}/packing?packed=1`);
}
