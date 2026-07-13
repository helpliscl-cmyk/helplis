export const MIME_SOURCE = "MIME_MINEDUC";
export const DEFAULT_MIME_BASE_URL = "https://mi.mineduc.cl/mime-web";
export const MIME_BASE_URL = (process.env.MIME_BASE_URL ?? DEFAULT_MIME_BASE_URL).replace(/\/+$/, "");
export const MIME_FICHA_PATH = "/mvc/mime/ficha";

export const DEFAULT_SAMPLE_RBDS = [8927, 5611, 10686, 5570, 9088];

export type MimeFieldValue = string | number | null;

export type MimeEstablishmentData = {
  rbd: number;
  name: string | null;
  status: string | null;
  region: string | null;
  province: string | null;
  commune: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  dependency: string | null;
  officialRecognition: string | null;
  educationLevels: string | null;
  totalEnrollment: number | null;
  averageStudentsPerCourse: number | null;
  directorName: string | null;
  holderName: string | null;
  phone: string | null;
  contactEmail: string | null;
  contacts: MimeContactData[];
  website: string | null;
  mimeUrl: string;
  source: typeof MIME_SOURCE;
  sourceCheckedAt: Date;
  contentHash: string;
  labeledData: Record<string, string>;
};

export type MimeContactType =
  | "ESTABLISHMENT_GENERAL"
  | "DIRECTOR"
  | "HOLDER"
  | "PARENTS_CENTER"
  | "STUDENT_CENTER"
  | "SCHOOL_COUNCIL"
  | "GENERIC_MINEDUC"
  | "UNKNOWN";

export type MimeContactData = {
  email: string;
  contactType: MimeContactType;
  label: string | null;
  section: string | null;
  sourceUrl: string;
};

export type MimeParseResult =
  | {
      ok: true;
      data: MimeEstablishmentData;
      warnings: string[];
    }
  | {
      ok: false;
      errorType: "NOT_FOUND" | "UNEXPECTED_STRUCTURE" | "MIME_ERROR_PAGE";
      errorMessage: string;
      warnings: string[];
    };

export type MimeScrapeConfig = {
  concurrency: 1;
  minDelayMs: number;
  jitterMs: number;
  maxRetries: number;
  backoffBaseMs: number;
  requestTimeoutMs: number;
  maxConsecutiveBlocked: number;
  skipRecentDays: number;
  sampleLimit: number;
  userAgent: string;
  baseUrl: string;
};

export const DEFAULT_MIME_SCRAPER_CONFIG: MimeScrapeConfig = {
  concurrency: 1,
  minDelayMs: Number(process.env.MIME_MIN_DELAY_MS ?? 3_000),
  jitterMs: Number(process.env.MIME_JITTER_MS ?? 1_500),
  maxRetries: Number(process.env.MIME_MAX_RETRIES ?? 3),
  backoffBaseMs: Number(process.env.MIME_BACKOFF_BASE_MS ?? 2_000),
  requestTimeoutMs: Number(process.env.MIME_REQUEST_TIMEOUT_MS ?? 15_000),
  maxConsecutiveBlocked: Number(process.env.MIME_MAX_CONSECUTIVE_BLOCKED ?? 3),
  skipRecentDays: Number(process.env.MIME_SKIP_RECENT_DAYS ?? 30),
  sampleLimit: Number(process.env.MIME_SAMPLE_LIMIT ?? 5),
  userAgent:
    process.env.MIME_USER_AGENT ??
    "HelPlis MIME research bot (contacto: admin@helplis.cl; purpose: public institutional CRM)",
  baseUrl: MIME_BASE_URL,
};

export function buildMimeUrl(rbd: number, baseUrl = MIME_BASE_URL) {
  return `${baseUrl.replace(/\/+$/, "")}${MIME_FICHA_PATH}?rbd=${encodeURIComponent(String(rbd))}`;
}
