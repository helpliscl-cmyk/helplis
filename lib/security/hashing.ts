import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function hashActivationCode(code: string) {
  return bcrypt.hash(normalizeActivationCode(code), BCRYPT_ROUNDS);
}

export async function verifyActivationCode(code: string, codeHash: string) {
  return bcrypt.compare(normalizeActivationCode(code), codeHash);
}

export function normalizeActivationCode(code: string) {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function hashIpAddress(ip: string | null | undefined) {
  if (!ip) return null;
  return crypto.createHash("sha256").update(ip).digest("hex");
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}
