import type { DeviceStatus } from "@prisma/client";

export type PublicDeviceActivationState = "UNACTIVATED" | "ACTIVE" | "SUSPENDED" | "DISABLED";
export type DeviceActivationState = PublicDeviceActivationState | "REASSIGNED";

export function getDeviceActivationState(status: DeviceStatus): PublicDeviceActivationState;
export function getDeviceActivationState(status: DeviceStatus, options: { reassigned?: boolean }): DeviceActivationState;
export function getDeviceActivationState(
  status: DeviceStatus,
  options: { reassigned?: boolean } = {},
): DeviceActivationState {
  if (["AVAILABLE", "UNASSIGNED", "RESERVED"].includes(status)) return "UNACTIVATED";
  if (status === "SUSPENDED") return "SUSPENDED";
  if (["DEACTIVATED", "REPLACED", "DAMAGED"].includes(status)) return "DISABLED";
  if (options.reassigned) return "REASSIGNED";
  return "ACTIVE";
}

export function canActivateStatus(status: DeviceStatus) {
  return getDeviceActivationState(status) === "UNACTIVATED";
}

export function isPubliclyUnavailableStatus(status: DeviceStatus) {
  return ["SUSPENDED", "DISABLED"].includes(getDeviceActivationState(status));
}

export function scanStatusMessage(status: DeviceStatus) {
  if (status === "LOST") return "Modo perdido";
  if (status === "FOUND") return "Marcado como encontrado";
  const activationState = getDeviceActivationState(status);
  if (activationState === "UNACTIVATED") return "No activado";
  if (activationState === "SUSPENDED") return "Suspendido temporalmente";
  if (activationState === "DISABLED") return "No disponible";
  return "Activo";
}
