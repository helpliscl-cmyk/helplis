import type { DeviceStatus } from "@prisma/client";

export function canActivateStatus(status: DeviceStatus) {
  return ["AVAILABLE", "UNASSIGNED", "RESERVED"].includes(status);
}

export function isPubliclyUnavailableStatus(status: DeviceStatus) {
  return ["SUSPENDED", "DEACTIVATED", "REPLACED", "DAMAGED"].includes(status);
}

export function scanStatusMessage(status: DeviceStatus) {
  if (status === "LOST") return "Modo perdido";
  if (status === "FOUND") return "Marcado como encontrado";
  if (canActivateStatus(status)) return "No activado";
  if (isPubliclyUnavailableStatus(status)) return "No disponible";
  return "Activo";
}
