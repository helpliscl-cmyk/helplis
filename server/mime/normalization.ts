import { createHash } from "node:crypto";

const NO_INFORMATION_VALUES = new Set([
  "",
  "-",
  "--",
  "s/i",
  "sin informacion",
  "sin información",
  "no informa",
  "no informado",
  "no informada",
  "no registra",
  "no disponible",
  "null",
]);

export function normalizeWhitespace(value: string | null | undefined) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeForMatch(value: string | null | undefined) {
  return normalizeWhitespace(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function emptyToNull(value: string | null | undefined) {
  const normalized = normalizeWhitespace(value);
  if (NO_INFORMATION_VALUES.has(normalizeForMatch(normalized))) return null;
  return normalized || null;
}

export function normalizeEmail(value: string | null | undefined) {
  const raw =
    emptyToNull(value)
      ?.toLowerCase()
      .replace(/^mailto:/, "")
      .split(/[?#]/)[0]
      .replace(/\s+/g, "") ?? null;
  if (!raw) return null;
  const match = raw.match(/[^\s@;,/]+@[^\s@;,/]+\.[^\s@;,/]+/);
  return match?.[0] ?? raw;
}

export function isValidEmailSyntax(value: string | null | undefined) {
  const email = normalizeEmail(value);
  return Boolean(email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
}

export function getEmailDomain(value: string | null | undefined) {
  const email = normalizeEmail(value);
  if (!email || !email.includes("@")) return null;
  return email.split("@").at(1) ?? null;
}

export function normalizePhoneChile(value: string | null | undefined) {
  const raw = emptyToNull(value);
  if (!raw) return null;

  const parts = raw
    .split(/[;/|]+/)
    .map((part) => normalizeSinglePhoneChile(part))
    .filter(Boolean);
  if (parts.length > 1) return [...new Set(parts)].join(" / ");
  return normalizeSinglePhoneChile(raw);
}

function normalizeSinglePhoneChile(value: string) {
  const digits = value.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
  const numeric = digits.startsWith("+") ? digits.slice(1) : digits;
  if (!numeric) return null;

  if (numeric.startsWith("56") && numeric.length >= 10) return `+${numeric}`;
  if (numeric.length === 9 || numeric.length === 8) return `+56${numeric}`;
  if (numeric.length > 9 && numeric.length <= 12) return `+${numeric}`;

  return emptyToNull(value);
}

export function normalizeWebsite(value: string | null | undefined) {
  const website = emptyToNull(value);
  if (!website) return null;
  const href = website.replace(/^https?:\/\/mailto:/i, "mailto:").trim();
  if (/^mailto:/i.test(href)) return null;
  if (/^https?:\/\//i.test(href)) return href;
  if (/^www\./i.test(href)) return `https://${href}`;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(href)) return `https://${href}`;
  return href;
}

export function normalizeHolderName(value: string | null | undefined) {
  const holder = emptyToNull(value);
  if (!holder) return null;

  return normalizeForMatch(holder)
    .replace(/\b(sociedad|educacional|educacion|limitada|ltda|spa|s a|sa|corp|corporacion)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseInteger(value: string | number | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  const raw = emptyToNull(String(value ?? ""));
  if (!raw) return null;
  const digits = raw.replace(/[^\d-]/g, "");
  if (!digits || digits === "-") return null;
  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseNumber(value: string | number | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const raw = emptyToNull(String(value ?? ""));
  if (!raw) return null;
  const normalized = raw.replace(/\./g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseRbd(value: string | number | null | undefined) {
  const parsed = parseInteger(value);
  if (!parsed || parsed < 1) return null;
  return parsed;
}

export function stableHash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function stableStringify(value: Record<string, unknown>) {
  const sorted = Object.keys(value)
    .sort()
    .reduce<Record<string, unknown>>((accumulator, key) => {
      accumulator[key] = value[key];
      return accumulator;
    }, {});
  return JSON.stringify(sorted);
}
