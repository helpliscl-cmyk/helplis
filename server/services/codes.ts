import crypto from "node:crypto";
import {
  ACTIVATION_CODE_LENGTH,
  PUBLIC_BASE_URL,
  PUBLIC_CODE_ALPHABET,
  PUBLIC_CODE_LENGTH,
} from "@/lib/constants";

export function generatePublicCode(length = PUBLIC_CODE_LENGTH) {
  let value = "";
  for (let index = 0; index < length; index += 1) {
    value += PUBLIC_CODE_ALPHABET[crypto.randomInt(PUBLIC_CODE_ALPHABET.length)];
  }
  return value;
}

export function generateActivationCode(length = ACTIVATION_CODE_LENGTH) {
  const chunks: string[] = [];
  while (chunks.join("").length < length) {
    chunks.push(PUBLIC_CODE_ALPHABET[crypto.randomInt(PUBLIC_CODE_ALPHABET.length)]);
  }
  return chunks.join("").slice(0, length).replace(/(.{5})/g, "$1-").replace(/-$/, "");
}

export function buildPublicUrl(publicCode: string, baseUrl = PUBLIC_BASE_URL) {
  return `${baseUrl.replace(/\/$/, "")}/p/${publicCode}`;
}

export function isAllowedPublicUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "helplis.cl" && /^\/p\/[A-Z0-9]{4,12}$/.test(parsed.pathname);
  } catch {
    return false;
  }
}

export async function generateUniquePublicCode(
  exists: (code: string) => Promise<boolean>,
  attempts = 20,
) {
  for (let index = 0; index < attempts; index += 1) {
    const code = generatePublicCode();
    if (!(await exists(code))) return code;
  }
  throw new Error("No fue posible generar un publicCode único.");
}
