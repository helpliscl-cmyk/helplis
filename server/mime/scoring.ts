import type { Establishment } from "@prisma/client";
import { getEmailDomain, normalizeForMatch } from "@/server/mime/normalization";

export type ScoreBreakdownItem = {
  label: string;
  matched: boolean;
  points: number;
};

export type ProspectScoreResult = {
  score: number;
  breakdown: ScoreBreakdownItem[];
};

function includesAny(value: string | null | undefined, words: string[]) {
  const normalized = normalizeForMatch(value);
  return words.some((word) => normalized.includes(normalizeForMatch(word)));
}

export function calculateProspectScore(
  establishment: Pick<
    Establishment,
    | "educationLevels"
    | "totalEnrollment"
    | "dependency"
    | "contactEmail"
    | "website"
    | "region"
    | "sourceCheckedAt"
  >,
  context: { holderEstablishmentCount?: number; now?: Date } = {},
): ProspectScoreResult {
  const now = context.now ?? new Date();
  const holderEstablishmentCount = context.holderEstablishmentCount ?? 0;
  const emailDomain = getEmailDomain(establishment.contactEmail);
  const recent =
    establishment.sourceCheckedAt &&
    now.getTime() - establishment.sourceCheckedAt.getTime() <= 90 * 24 * 60 * 60 * 1_000;

  const breakdown: ScoreBreakdownItem[] = [
    {
      label: "Educación parvularia o básica",
      matched: includesAny(establishment.educationLevels, ["parvularia", "básica", "basica"]),
      points: 12,
    },
    {
      label: "Matrícula total relevante",
      matched: Number(establishment.totalEnrollment ?? 0) >= 150,
      points: Number(establishment.totalEnrollment ?? 0) >= 500 ? 14 : 8,
    },
    {
      label: "Particular pagado",
      matched: includesAny(establishment.dependency, ["particular pagado"]),
      points: 14,
    },
    {
      label: "Particular subvencionado",
      matched: includesAny(establishment.dependency, ["particular subvencionado"]),
      points: 10,
    },
    {
      label: "Tiene correo",
      matched: Boolean(establishment.contactEmail),
      points: 8,
    },
    {
      label: "Tiene web",
      matched: Boolean(establishment.website),
      points: 5,
    },
    {
      label: "Correo con dominio institucional",
      matched: Boolean(emailDomain && !["gmail.com", "hotmail.com", "outlook.com", "yahoo.com"].includes(emailDomain)),
      points: 8,
    },
    {
      label: "Región Metropolitana",
      matched: includesAny(establishment.region, ["metropolitana"]),
      points: 8,
    },
    {
      label: "Región de O'Higgins",
      matched: includesAny(establishment.region, ["ohiggins", "o higgins", "libertador"]),
      points: 6,
    },
    {
      label: "Sostenedor con varios establecimientos",
      matched: holderEstablishmentCount > 1,
      points: holderEstablishmentCount > 4 ? 12 : 8,
    },
    {
      label: "Información actualizada recientemente",
      matched: Boolean(recent),
      points: 5,
    },
  ];

  return {
    score: breakdown.reduce((total, item) => total + (item.matched ? item.points : 0), 0),
    breakdown,
  };
}
