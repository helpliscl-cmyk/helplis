import { CommercialStatus, OrganizationStatus, OrganizationType, PrismaClient } from "@prisma/client";
import { buildMimeUrl } from "../server/mime/types";

const prisma = new PrismaClient();

const sample = [
  {
    rbd: 8927,
    name: "Liceo Demo Completo",
    region: "Region Metropolitana",
    province: "Santiago",
    commune: "Providencia",
    address: "Avda. Italia 980",
    dependency: "Particular subvencionado",
    educationLevels: "Parvularia, Basica y Media",
    totalEnrollment: 540,
    directorName: "Maria Directora",
    contactEmail: "contacto@liceodemo.cl",
    phone: "+5632036851",
    website: "https://www.liceodemo.cl",
    commercialStatus: CommercialStatus.PRIORIZADO,
    score: 70,
  },
  {
    rbd: 5611,
    name: "Escuela Demo Sin Correo",
    region: "Region Metropolitana",
    province: "Santiago",
    commune: "Santiago",
    address: "Los Aromos 123",
    dependency: "Municipal",
    educationLevels: "Basica",
    totalEnrollment: 180,
    directorName: "Direccion Demo",
    contactEmail: null,
    phone: "+56224066000",
    website: null,
    commercialStatus: CommercialStatus.CONTACTO_POR_INVESTIGAR,
    score: 33,
  },
  {
    rbd: 10686,
    name: "Colegio Demo Sin Telefono",
    region: "Region de Valparaiso",
    province: "Quillota",
    commune: "Calera",
    address: "Ignacio Carrera Pinto S/n",
    dependency: "Particular pagado",
    educationLevels: "Basica",
    totalEnrollment: 90,
    directorName: "Equipo Directivo Demo",
    contactEmail: "cpgmistral@example.cl",
    phone: null,
    website: "https://colegiodemo.example",
    commercialStatus: CommercialStatus.LISTO_PARA_CONTACTAR,
    score: 47,
  },
  {
    rbd: 5570,
    name: "Escuela Demo Rural",
    region: "Region de O'Higgins",
    province: "Cachapoal",
    commune: "Rancagua",
    address: "Camino Local 45",
    dependency: "Municipal",
    educationLevels: "Parvularia y Basica",
    totalEnrollment: 220,
    directorName: "Directora Rural Demo",
    contactEmail: "escuela.rural@example.cl",
    phone: "+56722223333",
    website: null,
    commercialStatus: CommercialStatus.SIN_REVISAR,
    score: 45,
  },
  {
    rbd: 9088,
    name: "Liceo Demo Seguimiento",
    region: "Region Metropolitana",
    province: "Santiago",
    commune: "Penalolen",
    address: "Avenida Demo 100",
    dependency: "Municipal",
    educationLevels: "Media",
    totalEnrollment: 410,
    directorName: "Director Seguimiento Demo",
    contactEmail: "direccion9088@example.cl",
    phone: "+56229397740",
    website: "https://liceoseguimiento.example",
    commercialStatus: CommercialStatus.SEGUIMIENTO,
    score: 52,
  },
];

async function main() {
  const holder = await prisma.holder.upsert({
    where: { normalizedName: "corporacion educacional demo mime" },
    create: {
      normalizedName: "corporacion educacional demo mime",
      originalName: "Corporacion Educacional Demo MIME",
      type: "Sostenedor demo local",
      website: "https://demo.helplis.cl",
      primaryEmail: "contacto@demo.helplis.cl",
      primaryPhone: "+56224066000",
    },
    update: {
      originalName: "Corporacion Educacional Demo MIME",
      primaryEmail: "contacto@demo.helplis.cl",
      primaryPhone: "+56224066000",
    },
  });

  const job = await prisma.scrapeJob.create({
    data: {
      type: "SAMPLE",
      status: "COMPLETED",
      totalItems: sample.length,
      processedItems: sample.length,
      successfulItems: sample.length,
      configuration: JSON.stringify({ source: "mime-seed-sample", sample: true }),
      startedAt: new Date(),
      finishedAt: new Date(),
      lastHeartbeatAt: new Date(),
    },
  });

  for (const item of sample) {
    const establishment = await prisma.establishment.upsert({
      where: { rbd: item.rbd },
      create: {
        rbd: item.rbd,
        name: item.name,
        status: "Funcionando",
        region: item.region,
        province: item.province,
        commune: item.commune,
        address: item.address,
        dependency: item.dependency,
        officialRecognition: "Reconocido oficialmente",
        educationLevels: item.educationLevels,
        totalEnrollment: item.totalEnrollment,
        directorName: item.directorName,
        holderName: holder.originalName,
        holderId: holder.id,
        phone: item.phone,
        contactEmail: item.contactEmail,
        website: item.website,
        mimeUrl: buildMimeUrl(item.rbd),
        source: "SEED_LOCAL_MIME_SAMPLE",
        sourceCheckedAt: new Date(),
        sourceChangedAt: new Date(),
        contentHash: `seed-local-${item.rbd}`,
        extraData: JSON.stringify({ fixture: true }),
      },
      update: {
        name: item.name,
        region: item.region,
        province: item.province,
        commune: item.commune,
        address: item.address,
        dependency: item.dependency,
        educationLevels: item.educationLevels,
        totalEnrollment: item.totalEnrollment,
        directorName: item.directorName,
        holderName: holder.originalName,
        holderId: holder.id,
        phone: item.phone,
        contactEmail: item.contactEmail,
        website: item.website,
        mimeUrl: buildMimeUrl(item.rbd),
      },
    });

    const existingContact = await prisma.contact.findFirst({
      where: { establishmentId: establishment.id, role: "Direccion" },
    });
    const contactData = {
      establishmentId: establishment.id,
      holderId: holder.id,
      name: item.directorName,
      role: "Direccion",
      email: item.contactEmail,
      phone: item.phone,
      source: "SEED_LOCAL_MIME_SAMPLE",
      sourceUrl: establishment.mimeUrl,
      verifiedAt: new Date(),
      emailStatus: item.contactEmail ? ("VALID_FORMAT" as const) : ("UNKNOWN" as const),
    };
    if (existingContact) {
      await prisma.contact.update({ where: { id: existingContact.id }, data: contactData });
    } else {
      await prisma.contact.create({ data: contactData });
    }

    const existingOrganization = await prisma.organization.findUnique({
      where: { establishmentId: establishment.id },
    });
    const organizationData = {
      name: item.name,
      type: OrganizationType.SCHOOL,
      contactName: item.directorName,
      contactEmail: item.contactEmail,
      contactPhone: item.phone,
      status: OrganizationStatus.PENDING,
      holderId: holder.id,
      commercialStatus: item.commercialStatus,
      priority: item.score,
      prospectScore: item.score,
      prospectScoreBreakdown: JSON.stringify([{ label: "Muestra local seed", matched: true, points: item.score }]),
      nextActionAt:
        item.commercialStatus === CommercialStatus.SEGUIMIENTO
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1_000)
          : null,
    };
    const organization = existingOrganization
      ? await prisma.organization.update({ where: { id: existingOrganization.id }, data: organizationData })
      : await prisma.organization.create({
          data: {
            ...organizationData,
            establishmentId: establishment.id,
            slug: `mime-rbd-${item.rbd}`,
          },
        });

    await prisma.opportunity.create({
      data: {
        organizationId: organization.id,
        stage: item.commercialStatus,
        estimatedValue: item.totalEnrollment * 18_000,
        probability: item.commercialStatus === CommercialStatus.PRIORIZADO ? 20 : 10,
        productInterest: "Pulseras QR/NFC para estudiantes",
        source: "SEED_LOCAL_MIME_SAMPLE",
        nextActionAt: organization.nextActionAt,
      },
    });

    await prisma.scrapeAttempt.create({
      data: {
        jobId: job.id,
        establishmentId: establishment.id,
        rbd: item.rbd,
        url: establishment.mimeUrl,
        status: "SUCCESS",
        httpStatus: 200,
        startedAt: new Date(),
        finishedAt: new Date(),
      },
    });
  }

  console.log(`Muestra MIME local lista: ${sample.length} establecimientos.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
