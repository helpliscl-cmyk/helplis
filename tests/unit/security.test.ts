import { describe, expect, it } from "vitest";
import {
  hashActivationCode,
  hashIpAddress,
  hashPassword,
  normalizeActivationCode,
  verifyActivationCode,
  verifyPassword,
} from "@/lib/security/hashing";

describe("seguridad local", () => {
  it("hashea contraseñas sin texto plano", async () => {
    const hash = await hashPassword("HelPlisDemo123!");
    expect(hash).not.toBe("HelPlisDemo123!");
    expect(hash.startsWith("$2")).toBe(true);
  });

  it("verifica contraseña correcta", async () => {
    const hash = await hashPassword("HelPlisDemo123!");
    expect(await verifyPassword("HelPlisDemo123!", hash)).toBe(true);
  });

  it("rechaza contraseña incorrecta", async () => {
    const hash = await hashPassword("HelPlisDemo123!");
    expect(await verifyPassword("otra", hash)).toBe(false);
  });

  it("normaliza activationCode con guiones y espacios", () => {
    expect(normalizeActivationCode(" act-hlp009 ")).toBe("ACTHLP009");
  });

  it("verifica activationCode normalizado", async () => {
    const hash = await hashActivationCode("ACT-HLP009");
    expect(await verifyActivationCode("act hlp009", hash)).toBe(true);
  });

  it("rechaza activationCode incorrecto", async () => {
    const hash = await hashActivationCode("ACT-HLP009");
    expect(await verifyActivationCode("ACT-HLP010", hash)).toBe(false);
  });

  it("anonimiza IP con hash estable", () => {
    expect(hashIpAddress("127.0.0.1")).toBe(hashIpAddress("127.0.0.1"));
  });

  it("no genera hash para IP ausente", () => {
    expect(hashIpAddress(null)).toBeNull();
  });
});
