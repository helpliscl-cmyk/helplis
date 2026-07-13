import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/auth/session";
import { parseRbd } from "@/server/mime/normalization";
import { prisma } from "@/server/db/client";

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function buildWhere(url: URL): Prisma.EstablishmentWhereInput {
  const q = url.searchParams.get("q")?.trim();
  const region = url.searchParams.get("region");
  const dependency = url.searchParams.get("dependency");
  const status = url.searchParams.get("status");
  const level = url.searchParams.get("level");
  const sourceType = url.searchParams.get("sourceType");
  const minEnrollment = Number(url.searchParams.get("minEnrollment") ?? 0);
  const and: Prisma.EstablishmentWhereInput[] = [];

  if (q) {
    const rbd = parseRbd(q);
    and.push({
      OR: [
        rbd ? { rbd } : undefined,
        { name: { contains: q } },
        { commune: { contains: q } },
        { holderName: { contains: q } },
        { contactEmail: { contains: q.toLowerCase() } },
        { website: { contains: q.toLowerCase() } },
      ].filter(Boolean) as Prisma.EstablishmentWhereInput[],
    });
  }
  if (region) and.push({ region });
  if (dependency) and.push({ dependency });
  if (status) and.push({ status });
  if (level) and.push({ educationLevels: { contains: level } });
  if (sourceType === "real") and.push({ source: "MIME_MINEDUC" });
  if (sourceType === "demo") and.push({ source: "SEED_LOCAL_MIME_SAMPLE" });
  if (sourceType === "imported") and.push({ source: "RBD_IMPORT" });
  if (minEnrollment > 0) and.push({ totalEnrollment: { gte: minEnrollment } });

  return and.length ? { AND: and } : {};
}

export async function GET(request: Request) {
  await requireRole(["ADMIN", "SUPER_ADMIN", "SUPPORT"]);
  const url = new URL(request.url);
  const rows = await prisma.establishment.findMany({
    where: buildWhere(url),
    include: { holder: true, commercialOrganizations: { take: 1 } },
    orderBy: { rbd: "asc" },
    take: 10_000,
  });

  const headers = [
    "rbd",
    "name",
    "status",
    "region",
    "province",
    "commune",
    "address",
    "dependency",
    "officialRecognition",
    "educationLevels",
    "totalEnrollment",
    "directorName",
    "holderName",
    "phone",
    "contactEmail",
    "website",
    "commercialStatus",
    "prospectScore",
    "sourceCheckedAt",
    "mimeUrl",
  ];
  const csv = [
    headers.map(csvCell).join(","),
    ...rows.map((row) =>
      [
        row.rbd,
        row.name,
        row.status,
        row.region,
        row.province,
        row.commune,
        row.address,
        row.dependency,
        row.officialRecognition,
        row.educationLevels,
        row.totalEnrollment,
        row.directorName,
        row.holder?.originalName ?? row.holderName,
        row.phone,
        row.contactEmail,
        row.website,
        row.commercialOrganizations[0]?.commercialStatus,
        row.commercialOrganizations[0]?.prospectScore,
        row.sourceCheckedAt?.toISOString(),
        row.mimeUrl,
      ]
        .map(csvCell)
        .join(","),
    ),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="helplis-mime-establecimientos.csv"`,
    },
  });
}
