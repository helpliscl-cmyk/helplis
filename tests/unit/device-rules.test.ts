import { describe, expect, it } from "vitest";
import { userCanManageDevice } from "@/server/services/device-access";
import {
  canActivateStatus,
  getDeviceActivationState,
  isPubliclyUnavailableStatus,
  scanStatusMessage,
} from "@/server/services/device-rules";

describe("reglas de dispositivo", () => {
  it("normaliza estados operativos al estado minimo de activacion", () => {
    expect(getDeviceActivationState("AVAILABLE")).toBe("UNACTIVATED");
    expect(getDeviceActivationState("UNASSIGNED")).toBe("UNACTIVATED");
    expect(getDeviceActivationState("RESERVED")).toBe("UNACTIVATED");
    expect(getDeviceActivationState("ACTIVATED")).toBe("ACTIVE");
    expect(getDeviceActivationState("LOST")).toBe("ACTIVE");
    expect(getDeviceActivationState("FOUND")).toBe("ACTIVE");
    expect(getDeviceActivationState("SUSPENDED")).toBe("SUSPENDED");
    expect(getDeviceActivationState("DEACTIVATED")).toBe("DISABLED");
    expect(getDeviceActivationState("REPLACED")).toBe("DISABLED");
    expect(getDeviceActivationState("DAMAGED")).toBe("DISABLED");
  });

  it("permite activar disponible", () => {
    expect(canActivateStatus("AVAILABLE")).toBe(true);
  });

  it("permite activar reservado", () => {
    expect(canActivateStatus("RESERVED")).toBe(true);
  });

  it("no permite activar ya activado", () => {
    expect(canActivateStatus("ACTIVATED")).toBe(false);
  });

  it("marca suspendido como no disponible públicamente", () => {
    expect(isPubliclyUnavailableStatus("SUSPENDED")).toBe(true);
  });

  it("marca reemplazado como no disponible públicamente", () => {
    expect(isPubliclyUnavailableStatus("REPLACED")).toBe(true);
  });

  it("muestra modo perdido", () => {
    expect(scanStatusMessage("LOST")).toBe("Modo perdido");
  });

  it("muestra no activado para disponible", () => {
    expect(scanStatusMessage("AVAILABLE")).toBe("No activado");
  });

  it("muestra activo para activado", () => {
    expect(scanStatusMessage("ACTIVATED")).toBe("Activo");
  });

  it("permite administrar al propietario o a roles con permiso", () => {
    const device = { ownerId: "owner_1", organizationId: "org_1" };

    expect(userCanManageDevice({ id: "owner_1", role: "USER" }, device)).toBe(true);
    expect(userCanManageDevice({ id: "admin_1", role: "ADMIN" }, device)).toBe(true);
    expect(
      userCanManageDevice({ id: "staff_1", role: "USER" }, device, [
        { organizationId: "org_1", role: "STAFF", status: "ACTIVE" },
      ]),
    ).toBe(true);
  });

  it("rechaza administrar a un usuario ajeno", () => {
    const device = { ownerId: "owner_1", organizationId: "org_1" };

    expect(userCanManageDevice({ id: "other_1", role: "USER" }, device)).toBe(false);
    expect(
      userCanManageDevice({ id: "viewer_1", role: "USER" }, device, [
        { organizationId: "org_1", role: "VIEWER", status: "ACTIVE" },
      ]),
    ).toBe(false);
  });
});
