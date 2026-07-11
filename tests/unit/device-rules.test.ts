import { describe, expect, it } from "vitest";
import { canActivateStatus, isPubliclyUnavailableStatus, scanStatusMessage } from "@/server/services/device-rules";

describe("reglas de dispositivo", () => {
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
});
