import type { Prisma, PrismaClient } from "@prisma/client";
import { getEmailDomain, isValidEmailSyntax, normalizeHolderName } from "@/server/mime/normalization";
import { calculateProspectScore } from "@/server/mime/scoring";
import type { MimeEstablishmentData } from "@/server/mime/types";
import { prisma } from "@/server/db/client";

const ESTABLISHMENT_FIELDS = [
  "name",
  "status",
  "region",
  "province",
  "commune",
  "address",
  "latitude",
  "longitude",
  "dependency",
  "officialRecognition",
  "educationLevels",
  "totalEnrollment",
  "averageStudentsPerCourse",
  "directorName",
  "holderName",
  "phone",
  "contactEmail",
  "website",
] as const;

type EstablishmentField = (typeof ESTABLISHMENT_FIELDS)[number];
type EstablishmentDataPatch = Pick<MimeEstablishmentData, EstablishmentField>;

function pickEstablishmentData(data: MimeEstablishmentData) {
  return {
    name: data.name,
    status: data.status,
    region: data.region,
    province: data.province,
    commune: data.commune,
    address: data.address,
    latitude: data.latitude,
    longitude: data.longitude,
    dependency: data.dependency,
    officialRecognition: data.officialRecognition,
    educationLevels: data.educationLevels,
    totalEnrollment: data.totalEnrollment,
    averageStudentsPerCourse: data.averageStudentsPerCourse,
    directorName: data.directorName,
    holderName: data.holderName,
    phone: data.phone,
    contactEmail: data.contactEmail,
    website: data.website,
  };
}

function changedFields(
  existing: Record<string, unknown> | null,
  next: EstablishmentDataPatch,
) {
  if (!existing) return [...ESTABLISHMENT_FIELDS];
  return ESTABLISHMENT_FIELDS.filter((field) => existing[field] !== next[field]);
}

function contactStatus(email: string | null) {
  if (!email) return "UNKNOWN";
  return isValidEmailSyntax(email) ? "VALID_FORMAT" : "INVALID_FORMAT";
}

function buildProspectSlug(rbd: number) {
  return `mime-rbd-${rbd}`;
}

export async function applyMimeEstablishmentData(
  data: MimeEstablishmentData,
  client: PrismaClient = prisma,
) {
  const existing = await client.establishment.findUnique({
    where: { rbd: data.rbd },
    include: { holder: true },
  });

  const holder =
    data.holderName && normalizeHolderName(data.holderName)
      ? await client.holder.upsert({
          where: { normalizedName: normalizeHolderName(data.holderName)! },
          create: {
            normalizedName: normalizeHolderName(data.holderName)!,
            originalName: data.holderName,
            website: data.website,
            primaryEmail: data.contactEmail,
            primaryPhone: data.phone,
          },
          update: {
            originalName: data.holderName,
            website: data.website ?? undefined,
            primaryEmail: data.contactEmail ?? undefined,
            primaryPhone: data.phone ?? undefined,
          },
        })
      : null;

  const nextFields = pickEstablishmentData(data);
  const fieldsChanged = existing?.contentHash === data.contentHash ? [] : changedFields(existing, nextFields);
  const checkedAt = data.sourceCheckedAt;
  const changedAt = existing ? (fieldsChanged.length ? checkedAt : existing.sourceChangedAt) : checkedAt;
  const createData: Prisma.EstablishmentUncheckedCreateInput = {
    rbd: data.rbd,
    ...nextFields,
    holderId: holder?.id,
    mimeUrl: data.mimeUrl,
    source: data.source,
    sourceCheckedAt: checkedAt,
    sourceChangedAt: checkedAt,
    contentHash: data.contentHash,
    extraData: JSON.stringify(data.labeledData),
  };
  const updateData: Prisma.EstablishmentUncheckedUpdateInput = {
    ...nextFields,
    holderId: holder?.id,
    mimeUrl: data.mimeUrl,
    source: data.source,
    sourceCheckedAt: checkedAt,
    sourceChangedAt: changedAt,
    contentHash: data.contentHash,
    extraData: JSON.stringify(data.labeledData),
  };

  const establishment = await client.establishment.upsert({
    where: { rbd: data.rbd },
    create: createData,
    update: updateData,
  });

  if (existing && fieldsChanged.length) {
    await client.establishmentChange.create({
      data: {
        establishmentId: establishment.id,
        source: data.source,
        sourceUrl: data.mimeUrl,
        changedFields: JSON.stringify(fieldsChanged),
        previousData: JSON.stringify(pickEstablishmentData(existing as unknown as MimeEstablishmentData)),
        newData: JSON.stringify(nextFields),
        contentHash: data.contentHash,
      },
    });
  }

  const domain = getEmailDomain(data.contactEmail);
  const suppressions = await client.suppression.findMany({
    where: {
      OR: [
        data.contactEmail ? { email: data.contactEmail } : undefined,
        domain ? { domain } : undefined,
        { establishmentId: establishment.id },
      ].filter(Boolean) as Array<{ email?: string; domain?: string; establishmentId?: string }>,
    },
  });
  const suppressed = suppressions.length > 0;

  for (const contact of data.contacts) {
    const existingContact = await client.contact.findFirst({
      where: { establishmentId: establishment.id, email: contact.email, contactType: contact.contactType },
    });
    const suppressedContact = contact.contactType === "GENERIC_MINEDUC" || suppressed;
    const contactData = {
      establishmentId: establishment.id,
      holderId: holder?.id,
      name: null,
      role: contact.contactType,
      email: contact.email,
      phone: null,
      contactType: contact.contactType,
      label: contact.label,
      section: contact.section,
      source: data.source,
      sourceUrl: contact.sourceUrl,
      verifiedAt: checkedAt,
      emailStatus: suppressedContact ? "SUPPRESSED" : contactStatus(contact.email),
      doNotContact: suppressedContact,
    } as const;

    if (existingContact) {
      await client.contact.update({ where: { id: existingContact.id }, data: contactData });
    } else {
      await client.contact.create({ data: contactData });
    }
  }

  const primaryContact = data.contactEmail
    ? data.contacts.find((contact) => contact.email === data.contactEmail)
    : null;

  if (data.contactEmail || data.phone || data.directorName) {
    const existingContact = data.contactEmail
      ? await client.contact.findFirst({ where: { establishmentId: establishment.id, email: data.contactEmail } })
      : await client.contact.findFirst({ where: { establishmentId: establishment.id, role: "Dirección" } });

    const contactData = {
      establishmentId: establishment.id,
      holderId: holder?.id,
      name: data.directorName,
      role: data.directorName ? "Dirección" : "Contacto institucional",
      email: data.contactEmail,
      phone: data.phone,
      contactType: primaryContact?.contactType ?? "ESTABLISHMENT_GENERAL",
      label: primaryContact?.label ?? "Informacion institucional",
      section: primaryContact?.section ?? "Informacion institucional",
      source: data.source,
      sourceUrl: data.mimeUrl,
      verifiedAt: checkedAt,
      emailStatus: suppressed ? "SUPPRESSED" : contactStatus(data.contactEmail),
      doNotContact: suppressed,
    } as const;

    if (existingContact) {
      await client.contact.update({ where: { id: existingContact.id }, data: contactData });
    } else {
      await client.contact.create({ data: contactData });
    }
  }

  const holderEstablishmentCount = holder
    ? await client.establishment.count({ where: { holderId: holder.id } })
    : 0;
  const score = calculateProspectScore(establishment, { holderEstablishmentCount, now: checkedAt });
  const existingOrganization = await client.organization.findUnique({
    where: { establishmentId: establishment.id },
  });
  const forcedDoNotContact = suppressed || Boolean(existingOrganization?.doNotContact);

  const organizationData = {
    name: establishment.name ?? `Establecimiento RBD ${establishment.rbd}`,
    type: "SCHOOL" as const,
    contactName: data.directorName,
    contactEmail: data.contactEmail,
    contactPhone: data.phone,
    holderId: holder?.id,
    commercialStatus: forcedDoNotContact
      ? ("NO_CONTACTAR" as const)
      : existingOrganization?.commercialStatus ?? ("SIN_REVISAR" as const),
    doNotContact: forcedDoNotContact,
    priority: score.score,
    prospectScore: score.score,
    prospectScoreBreakdown: JSON.stringify(score.breakdown),
  };

  const organization = existingOrganization
    ? await client.organization.update({
        where: { id: existingOrganization.id },
        data: organizationData,
      })
    : await client.organization.create({
        data: {
          ...organizationData,
          establishmentId: establishment.id,
          slug: buildProspectSlug(establishment.rbd),
          status: "PENDING",
        },
      });

  return {
    establishment,
    holder,
    organization,
    changedFields: fieldsChanged,
    suppressed,
    score,
  };
}
