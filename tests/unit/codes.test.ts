import { describe, expect, it } from "vitest";
import {
  buildPublicUrl,
  generateActivationCode,
  generatePublicCode,
  generateUniquePublicCode,
  isAllowedPublicUrl,
} from "@/server/services/codes";

describe("códigos públicos y URL", () => {
  it("genera publicCode con largo esperado", () => {
    expect(generatePublicCode()).toHaveLength(6);
  });

  it("usa caracteres aptos para lectura humana", () => {
    expect(generatePublicCode()).toMatch(/^[A-Z2-9]+$/);
  });

  it("genera códigos de activación con separador", () => {
    expect(generateActivationCode()).toMatch(/^[A-Z2-9]{5}-[A-Z2-9]{5}$/);
  });

  it("construye URL pública con dominio base", () => {
    expect(buildPublicUrl("ABC123")).toBe("https://helplis.cl/p/ABC123");
  });

  it("acepta URL pública del dominio base", () => {
    expect(isAllowedPublicUrl("https://helplis.cl/p/ABC123")).toBe(true);
  });

  it("rechaza dominios externos", () => {
    expect(isAllowedPublicUrl("https://example.com/p/ABC123")).toBe(false);
  });

  it("rechaza rutas no públicas", () => {
    expect(isAllowedPublicUrl("https://helplis.cl/admin")).toBe(false);
  });

  it("genera código único si el primero no existe", async () => {
    const code = await generateUniquePublicCode(async () => false);
    expect(code).toHaveLength(6);
  });

  it("reintenta cuando hay colisión", async () => {
    let calls = 0;
    const code = await generateUniquePublicCode(async () => {
      calls += 1;
      return calls === 1;
    });
    expect(code).toHaveLength(6);
    expect(calls).toBeGreaterThan(1);
  });
});
