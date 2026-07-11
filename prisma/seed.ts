import {
  ActivationStatus,
  BatchStatus,
  CampaignStatus,
  ContactActionType,
  DeviceStatus,
  NotificationEventType,
  NotificationStatus,
  OrganizationStatus,
  OrganizationType,
  PrismaClient,
  ProductType,
  ProfileType,
  ScanMethod,
  UserRole,
  UserStatus,
} from "@prisma/client";
import { OFFICIAL_CONTACT } from "../lib/constants";
import { hashActivationCode, hashPassword } from "../lib/security/hashing";
import { buildPublicUrl } from "../server/services/codes";

const prisma = new PrismaClient();

const demoPassword = "HelPlisDemo123!";

const demoActivationCodes: Record<string, string> = {
  HLP001: "ACT-HLP001",
  HLP002: "ACT-HLP002",
  HLP003: "ACT-HLP003",
  HLP004: "ACT-HLP004",
  HLP005: "ACT-HLP005",
  HLP006: "ACT-HLP006",
  HLP007: "ACT-HLP007",
  HLP008: "ACT-HLP008",
  HLP009: "ACT-HLP009",
  HLP010: "ACT-HLP010",
  HLP011: "ACT-HLP011",
  HLP012: "ACT-HLP012",
  HLP013: "ACT-HLP013",
  HLP014: "ACT-HLP014",
  HLP015: "ACT-HLP015",
  HLP016: "ACT-HLP016",
  HLP017: "ACT-HLP017",
  HLP018: "ACT-HLP018",
  HLP019: "ACT-HLP019",
  HLP020: "ACT-HLP020",
};

async function resetDatabase() {
  await prisma.contactAction.deleteMany();
  await prisma.notificationEvent.deleteMany();
  await prisma.scanEvent.deleteMany();
  await prisma.activation.deleteMany();
  await prisma.importRow.deleteMany();
  await prisma.importJob.deleteMany();
  await prisma.emergencyContact.deleteMany();
  await prisma.device.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.organizationMembership.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.supportMessage.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await resetDatabase();

  const passwordHash = await hashPassword(demoPassword);

  const [admin, support, orgAdmin, user, familyUser] = await Promise.all([
    prisma.user.create({
      data: {
        email: "admin@demo.helplis.cl",
        name: "Administradora Demo",
        phone: "+56911111111",
        passwordHash,
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: "soporte@demo.helplis.cl",
        name: "Soporte Demo",
        phone: "+56922222222",
        passwordHash,
        role: UserRole.SUPPORT,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: "colegio@demo.helplis.cl",
        name: "Encargada Colegio Demo",
        phone: "+56933333333",
        passwordHash,
        role: UserRole.ORGANIZATION_ADMIN,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: "usuario@demo.helplis.cl",
        name: "Usuario Demo",
        phone: "+56944444444",
        passwordHash,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: "familia@demo.helplis.cl",
        name: "Responsable Familiar Demo",
        phone: "+56955555555",
        passwordHash,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      },
    }),
  ]);

  const [school, veterinary] = await Promise.all([
    prisma.organization.create({
      data: {
        name: "Colegio Demo Los Aromos",
        type: OrganizationType.SCHOOL,
        slug: "colegio-demo-los-aromos",
        contactName: "Equipo de convivencia",
        contactEmail: "contacto@losaromos.example",
        contactPhone: "+56966666666",
        status: OrganizationStatus.ACTIVE,
        discountCode: "AROMOS10",
        discountPercentage: 10,
        commissionPercentage: 5,
        landingTitle: "Programa piloto de identificación segura",
        landingDescription:
          "Acceso institucional ficticio para activar dispositivos HelPlis en una comunidad educativa.",
      },
    }),
    prisma.organization.create({
      data: {
        name: "Veterinaria Demo Norte",
        type: OrganizationType.VETERINARY,
        slug: "veterinaria-demo-norte",
        contactName: "Coordinación veterinaria",
        contactEmail: "contacto@vetnorte.example",
        contactPhone: "+56977777777",
        status: OrganizationStatus.ACTIVE,
        discountCode: "MASCOTA15",
        discountPercentage: 15,
        commissionPercentage: 8,
        landingTitle: "Identificación para mascotas",
        landingDescription:
          "Convenio ficticio para tags de mascotas con QR y NFC.",
      },
    }),
  ]);

  await prisma.organizationMembership.createMany({
    data: [
      {
        organizationId: school.id,
        userId: orgAdmin.id,
        role: "OWNER",
        status: "ACTIVE",
      },
      {
        organizationId: school.id,
        userId: admin.id,
        role: "ADMIN",
        status: "ACTIVE",
      },
    ],
  });

  await prisma.campaign.createMany({
    data: [
      {
        organizationId: school.id,
        name: "Piloto familias 2026",
        slug: "piloto-familias-2026",
        description: "Campaña institucional ficticia para apoderados.",
        discountCode: "AROMOS10",
        discountPercentage: 10,
        commissionPercentage: 5,
        status: CampaignStatus.ACTIVE,
      },
      {
        organizationId: veterinary.id,
        name: "Tags mascotas demo",
        slug: "tags-mascotas-demo",
        description: "Campaña ficticia para pacientes frecuentes.",
        discountCode: "MASCOTA15",
        discountPercentage: 15,
        commissionPercentage: 8,
        status: CampaignStatus.ACTIVE,
      },
    ],
  });

  const [batchA, batchB] = await Promise.all([
    prisma.batch.create({
      data: {
        supplierName: "Proveedor Ficticio A",
        supplierReference: "SUP-DEMO-A",
        internalReference: "HLP-BATCH-2026-001",
        quantity: 12,
        receivedQuantity: 12,
        productionDate: new Date("2026-06-01T12:00:00.000Z"),
        receivedAt: new Date("2026-06-18T12:00:00.000Z"),
        shippingMethod: "Courier demo",
        status: BatchStatus.RECEIVED,
        notes: "Lote ficticio para pruebas locales.",
      },
    }),
    prisma.batch.create({
      data: {
        supplierName: "Proveedor Ficticio B",
        supplierReference: "SUP-DEMO-B",
        internalReference: "HLP-BATCH-2026-002",
        quantity: 8,
        receivedQuantity: 6,
        productionDate: new Date("2026-06-15T12:00:00.000Z"),
        shippedAt: new Date("2026-06-25T12:00:00.000Z"),
        shippingMethod: "Aéreo demo",
        status: BatchStatus.PARTIALLY_RECEIVED,
        notes: "Incluye tags de mascota y llaveros demo.",
      },
    }),
  ]);

  const profiles = await Promise.all([
    prisma.profile.create({
      data: {
        ownerId: familyUser.id,
        type: ProfileType.CHILD,
        displayName: "Mateo",
        legalName: "Mateo Ficticio",
        alias: "Mati",
        description: "Niño ficticio inscrito en programa demo.",
        allergies: "Maní",
        medicalNotes: "Usar información médica solo en caso de emergencia.",
        specialInstructions: "Contactar primero a la madre registrada.",
        birthYear: 2018,
        showMedicalInfo: true,
        showAge: true,
      },
    }),
    prisma.profile.create({
      data: {
        ownerId: familyUser.id,
        type: ProfileType.CHILD,
        displayName: "Sofía",
        legalName: "Sofía Ficticia",
        alias: "Sofi",
        description: "Perfil infantil ficticio con privacidad restringida.",
        specialInstructions: "Esperar con personal autorizado.",
        birthYear: 2020,
        showMedicalInfo: false,
        showPhoneNumbers: true,
        showAge: false,
      },
    }),
    prisma.profile.create({
      data: {
        ownerId: user.id,
        type: ProfileType.SENIOR,
        displayName: "Rosa",
        legalName: "Rosa Ficticia",
        description: "Adulto mayor ficticio con instrucciones de asistencia.",
        medicalNotes: "Puede desorientarse en espacios nuevos.",
        medications: "Medicamento demo mañana y noche.",
        bloodType: "O+",
        specialInstructions: "Hablar con calma y contactar a responsable.",
        birthYear: 1947,
        showMedicalInfo: true,
        showAge: true,
      },
    }),
    prisma.profile.create({
      data: {
        ownerId: user.id,
        type: ProfileType.MEDICAL_PROFILE,
        displayName: "Perfil Médico Demo",
        alias: "Paciente demo",
        description: "Perfil médico ficticio para pruebas de privacidad.",
        allergies: "Penicilina",
        medications: "Inhalador demo",
        bloodType: "A+",
        specialInstructions: "Contactar al responsable y servicios médicos si corresponde.",
        showMedicalInfo: true,
      },
    }),
    prisma.profile.create({
      data: {
        ownerId: familyUser.id,
        type: ProfileType.PET,
        displayName: "Luna",
        species: "Perro",
        breed: "Mestiza",
        color: "Café claro",
        lostMessage: "Luna puede asustarse con ruidos fuertes.",
        rewardMessage: "Recompensa demo disponible.",
        showCallButton: true,
        showWhatsAppButton: true,
      },
    }),
    prisma.profile.create({
      data: {
        ownerId: user.id,
        type: ProfileType.PET,
        displayName: "Simón",
        species: "Gato",
        breed: "Doméstico",
        color: "Gris",
        lostMessage: "Gato ficticio de interior.",
      },
    }),
    prisma.profile.create({
      data: {
        ownerId: user.id,
        type: ProfileType.LUGGAGE,
        displayName: "Maleta Azul",
        objectDescription: "Maleta ficticia de cabina, color azul.",
        lostMessage: "Por favor contacte al responsable sin abrir la maleta.",
      },
    }),
    prisma.profile.create({
      data: {
        ownerId: user.id,
        type: ProfileType.OBJECT,
        displayName: "Llaves Demo",
        objectDescription: "Llavero ficticio con varias llaves.",
        rewardMessage: "Gracias por avisar. Recompensa demo simbólica.",
      },
    }),
  ]);

  const contacts = [
    { profileId: profiles[0].id, name: "Camila Demo", relationship: "Madre", phone: "+56988880001", email: "camila@example.test" },
    { profileId: profiles[0].id, name: "Diego Demo", relationship: "Padre", phone: "+56988880002", email: "diego@example.test" },
    { profileId: profiles[1].id, name: "Camila Demo", relationship: "Madre", phone: "+56988880001", email: "camila@example.test" },
    { profileId: profiles[2].id, name: "Andrea Demo", relationship: "Hija", phone: "+56988880003", email: "andrea@example.test" },
    { profileId: profiles[3].id, name: "Contacto Salud Demo", relationship: "Responsable", phone: "+56988880004", email: "salud@example.test" },
    { profileId: profiles[4].id, name: "Tutor Luna", relationship: "Tutor", phone: "+56988880005", email: "luna@example.test" },
    { profileId: profiles[5].id, name: "Tutor Simón", relationship: "Tutor", phone: "+56988880006", email: "simon@example.test" },
    { profileId: profiles[6].id, name: "Dueño Maleta", relationship: "Responsable", phone: "+56988880007", email: "maleta@example.test" },
    { profileId: profiles[7].id, name: "Dueño Llaves", relationship: "Responsable", phone: "+56988880008", email: "llaves@example.test" },
  ];

  await prisma.emergencyContact.createMany({
    data: contacts.map((contact, index) => ({
      ...contact,
      priority: index % 2 === 0 ? 1 : 2,
      isVisible: true,
      whatsappEnabled: true,
      callEnabled: true,
      messageEnabled: true,
    })),
  });

  const deviceSpecs = [
    { code: "HLP001", type: ProductType.WRISTBAND, status: DeviceStatus.ACTIVATED, ownerId: familyUser.id, profileId: profiles[0].id, org: school.id, batch: batchA.id },
    { code: "HLP002", type: ProductType.WRISTBAND, status: DeviceStatus.ACTIVATED, ownerId: familyUser.id, profileId: profiles[1].id, org: school.id, batch: batchA.id },
    { code: "HLP003", type: ProductType.WRISTBAND, status: DeviceStatus.LOST, ownerId: user.id, profileId: profiles[2].id, org: null, batch: batchA.id },
    { code: "HLP004", type: ProductType.CARD, status: DeviceStatus.ACTIVATED, ownerId: user.id, profileId: profiles[3].id, org: null, batch: batchA.id },
    { code: "HLP005", type: ProductType.PET_TAG, status: DeviceStatus.LOST, ownerId: familyUser.id, profileId: profiles[4].id, org: veterinary.id, batch: batchB.id },
    { code: "HLP006", type: ProductType.PET_TAG, status: DeviceStatus.ACTIVATED, ownerId: user.id, profileId: profiles[5].id, org: veterinary.id, batch: batchB.id },
    { code: "HLP007", type: ProductType.LUGGAGE_TAG, status: DeviceStatus.FOUND, ownerId: user.id, profileId: profiles[6].id, org: null, batch: batchB.id },
    { code: "HLP008", type: ProductType.KEYCHAIN, status: DeviceStatus.ACTIVATED, ownerId: user.id, profileId: profiles[7].id, org: null, batch: batchB.id },
    { code: "HLP009", type: ProductType.WRISTBAND, status: DeviceStatus.AVAILABLE, ownerId: null, profileId: null, org: school.id, batch: batchA.id },
    { code: "HLP010", type: ProductType.WRISTBAND, status: DeviceStatus.AVAILABLE, ownerId: null, profileId: null, org: school.id, batch: batchA.id },
    { code: "HLP011", type: ProductType.STICKER, status: DeviceStatus.RESERVED, ownerId: null, profileId: null, org: null, batch: batchA.id },
    { code: "HLP012", type: ProductType.ASSET_TAG, status: DeviceStatus.UNASSIGNED, ownerId: null, profileId: null, org: null, batch: batchA.id },
    { code: "HLP013", type: ProductType.KEYCHAIN, status: DeviceStatus.SUSPENDED, ownerId: null, profileId: null, org: null, batch: batchA.id },
    { code: "HLP014", type: ProductType.CARD, status: DeviceStatus.DEACTIVATED, ownerId: null, profileId: null, org: null, batch: batchA.id },
    { code: "HLP015", type: ProductType.WRISTBAND, status: DeviceStatus.DAMAGED, ownerId: null, profileId: null, org: null, batch: batchA.id },
    { code: "HLP016", type: ProductType.PET_TAG, status: DeviceStatus.AVAILABLE, ownerId: null, profileId: null, org: veterinary.id, batch: batchB.id },
    { code: "HLP017", type: ProductType.LUGGAGE_TAG, status: DeviceStatus.AVAILABLE, ownerId: null, profileId: null, org: null, batch: batchB.id },
    { code: "HLP018", type: ProductType.ASSET_TAG, status: DeviceStatus.AVAILABLE, ownerId: null, profileId: null, org: school.id, batch: batchB.id },
    { code: "HLP019", type: ProductType.STICKER, status: DeviceStatus.REPLACED, ownerId: null, profileId: null, org: null, batch: batchB.id },
    { code: "HLP020", type: ProductType.OTHER, status: DeviceStatus.AVAILABLE, ownerId: null, profileId: null, org: null, batch: batchB.id },
  ];

  const devices = [];
  for (const spec of deviceSpecs) {
    devices.push(
      await prisma.device.create({
        data: {
          publicCode: spec.code,
          publicUrl: buildPublicUrl(spec.code),
          nfcUid: `04:DE:MO:${spec.code.slice(-3)}`,
          activationCodeHash: await hashActivationCode(demoActivationCodes[spec.code]),
          activationCodeUsedAt:
            spec.status === DeviceStatus.ACTIVATED ||
            spec.status === DeviceStatus.LOST ||
            spec.status === DeviceStatus.FOUND
              ? new Date()
              : null,
          batchId: spec.batch,
          productType: spec.type,
          status: spec.status,
          ownerId: spec.ownerId,
          profileId: spec.profileId,
          organizationId: spec.org,
          activatedAt:
            spec.status === DeviceStatus.ACTIVATED ||
            spec.status === DeviceStatus.LOST ||
            spec.status === DeviceStatus.FOUND
              ? new Date("2026-07-01T12:00:00.000Z")
              : null,
          suspendedAt: spec.status === DeviceStatus.SUSPENDED ? new Date() : null,
          deactivatedAt: spec.status === DeviceStatus.DEACTIVATED ? new Date() : null,
        },
      }),
    );
  }

  const activatedDevices = devices.filter((device) => device.profileId);
  for (const device of activatedDevices) {
    await prisma.activation.create({
      data: {
        deviceId: device.id,
        userId: device.ownerId,
        status: ActivationStatus.COMPLETED,
        completedAt: device.activatedAt,
        attemptCount: 1,
      },
    });
  }

  const scans = [];
  for (const [index, device] of activatedDevices.entries()) {
    for (let count = 0; count < index + 1; count += 1) {
      scans.push(
        await prisma.scanEvent.create({
          data: {
            deviceId: device.id,
            profileId: device.profileId,
            scanMethod: count % 2 === 0 ? ScanMethod.QR : ScanMethod.NFC,
            ipHash: `demo-ip-hash-${index}-${count}`,
            userAgent: "Mozilla/5.0 Demo",
            deviceType: "mobile",
            browser: "Demo Browser",
            operatingSystem: "Demo OS",
            country: "CL",
            region: "Región Metropolitana",
            city: "Santiago",
            latitude: count === 0 ? -33.4489 + index / 100 : null,
            longitude: count === 0 ? -70.6693 - index / 100 : null,
            locationAccuracy: count === 0 ? 32 : null,
            locationPermission: count === 0,
            locationSharedAt: count === 0 ? new Date() : null,
            referrer: "seed",
            sessionId: `seed-${device.publicCode}-${count}`,
          },
        }),
      );
    }
  }

  await prisma.contactAction.createMany({
    data: scans.slice(0, 14).map((scan, index) => ({
      deviceId: scan.deviceId,
      profileId: scan.profileId,
      scanEventId: scan.id,
      action: [
        ContactActionType.PROFILE_VIEWED,
        ContactActionType.CALL_CLICKED,
        ContactActionType.WHATSAPP_CLICKED,
        ContactActionType.LOCATION_SHARED,
        ContactActionType.FOUND_REPORTED,
        ContactActionType.LINK_COPIED,
        ContactActionType.EMERGENCY_REPORTED,
      ][index % 7],
      metadata: JSON.stringify({ demo: true, source: "seed" }),
      ipHash: `demo-action-ip-${index}`,
      userAgent: "Mozilla/5.0 Demo",
    })),
  });

  await prisma.notificationEvent.createMany({
    data: scans.slice(0, 16).map((scan, index) => ({
      userId: activatedDevices.find((device) => device.id === scan.deviceId)?.ownerId ?? admin.id,
      deviceId: scan.deviceId,
      profileId: scan.profileId,
      scanEventId: scan.id,
      channel: "LOCAL",
      eventType:
        index % 3 === 0
          ? NotificationEventType.LOCATION_SHARED
          : NotificationEventType.DEVICE_SCANNED,
      recipient: OFFICIAL_CONTACT.email,
      status: NotificationStatus.SIMULATED,
      payload: JSON.stringify({
        demo: true,
        message: "Notificación local simulada desde seed.",
        publicCode: activatedDevices.find((device) => device.id === scan.deviceId)?.publicCode,
      }),
      sentAt: new Date(),
    })),
  });

  await prisma.importJob.create({
    data: {
      batchId: batchB.id,
      organizationId: veterinary.id,
      filename: "demo-import.csv",
      status: "VALIDATED",
      totalRows: 4,
      validRows: 3,
      invalidRows: 1,
      errors: JSON.stringify([{ row: 4, error: "UID NFC duplicado demo" }]),
      rows: {
        create: [
          {
            rowNumber: 1,
            publicCode: "HLP016",
            publicUrl: buildPublicUrl("HLP016"),
            nfcUid: "04:DE:MO:016",
            productType: ProductType.PET_TAG,
            isValid: true,
            rawData: "HLP016,04:DE:MO:016,PET_TAG",
          },
          {
            rowNumber: 2,
            publicCode: "HLP017",
            publicUrl: buildPublicUrl("HLP017"),
            nfcUid: "04:DE:MO:017",
            productType: ProductType.LUGGAGE_TAG,
            isValid: true,
            rawData: "HLP017,04:DE:MO:017,LUGGAGE_TAG",
          },
          {
            rowNumber: 3,
            publicCode: "HLP018",
            publicUrl: buildPublicUrl("HLP018"),
            nfcUid: "04:DE:MO:018",
            productType: ProductType.ASSET_TAG,
            isValid: true,
            rawData: "HLP018,04:DE:MO:018,ASSET_TAG",
          },
          {
            rowNumber: 4,
            publicCode: "HLP016",
            publicUrl: buildPublicUrl("HLP016"),
            nfcUid: "04:DE:MO:016",
            productType: ProductType.PET_TAG,
            isValid: false,
            errors: JSON.stringify(["publicCode duplicado", "UID NFC duplicado"]),
            rawData: "HLP016,04:DE:MO:016,PET_TAG",
          },
        ],
      },
    },
  });

  await prisma.supportMessage.create({
    data: {
      userId: support.id,
      name: "Consulta Demo",
      email: "consulta@example.test",
      phone: "+56999990000",
      subject: "Activación de prueba",
      message: "Mensaje ficticio creado por seed para validar soporte local.",
      status: "NEW",
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        actorUserId: admin.id,
        action: "SEED_DATABASE",
        entityType: "System",
        newData: JSON.stringify({ users: 5, devices: 20, profiles: profiles.length }),
      },
      {
        actorUserId: orgAdmin.id,
        action: "ORGANIZATION_CAMPAIGN_CREATED",
        entityType: "Organization",
        entityId: school.id,
      },
      {
        actorUserId: user.id,
        action: "DEVICE_MARKED_LOST",
        entityType: "Device",
        entityId: devices[2].id,
      },
    ],
  });

  console.log("Seed HelPlis completado.");
  console.log(`Credenciales demo: admin@demo.helplis.cl / ${demoPassword}`);
  console.log("Activación demo disponible: publicCode HLP009 + código ACT-HLP009");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
