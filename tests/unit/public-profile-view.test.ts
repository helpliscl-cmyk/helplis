import { describe, expect, it } from "vitest";
import type { EmergencyContact, Profile } from "@prisma/client";
import { buildPublicProfileView } from "@/server/profiles/public-view";

function profile(overrides: Partial<Profile> = {}, contacts: Partial<EmergencyContact>[] = []) {
  const base = {
    id: "profile_1",
    ownerId: "user_1",
    type: "CHILD",
    displayName: "Mateo Demo",
    legalName: "Mateo Demo Full",
    alias: "Mati",
    photoUrl: "https://example.test/mati.webp",
    photoStoragePath: null,
    photoMimeType: null,
    photoWidth: null,
    photoHeight: null,
    photoSizeBytes: null,
    photoUpdatedAt: null,
    headline: "Nino con HelPlis",
    helpMessage: "Contacta a mi adulto responsable.",
    description: "Descripcion autorizada.",
    statusMessage: null,
    firstName: "Mateo",
    lastName: "Demo",
    approximateAge: 8,
    genderOptional: null,
    communicationNotes: "Hablar con calma.",
    mobilityNotes: null,
    sensoryNotes: null,
    cognitiveNotes: null,
    medicalNotes: null,
    allergies: "Mani",
    medicalConditions: "Condicion demo",
    medications: "Medicamento demo",
    bloodType: "O+",
    medicalInstructions: "Evitar mani.",
    emergencyInstructions: "Contactar adulto.",
    criticalInformation: null,
    organDonorOptional: null,
    healthProviderOptional: null,
    specialInstructions: "Contactar adulto.",
    preferredLanguage: "es",
    birthYear: 2018,
    country: "CL",
    region: "RM",
    commune: "Santiago",
    generalArea: "Sector demo",
    exactAddress: "Calle privada 123",
    species: null,
    petName: null,
    breed: null,
    color: "Azul",
    sex: null,
    sterilizedOptional: null,
    veterinaryNotes: null,
    microchipNumberOptional: null,
    petBehaviorNotes: null,
    objectName: null,
    objectCategory: null,
    brand: null,
    model: null,
    objectDescription: null,
    rewardMessage: null,
    returnInstructions: null,
    lostMessage: null,
    showPhoto: true,
    showDisplayName: true,
    showFullName: false,
    showAlias: true,
    showCriticalInformation: false,
    showMedicalInfo: false,
    showContactNames: true,
    showPhoneNumbers: false,
    showAge: false,
    showApproximateAge: true,
    showBloodType: false,
    showAllergies: true,
    showMedicalConditions: true,
    showMedications: false,
    showMedicalInstructions: true,
    showCommunicationNotes: true,
    showMobilityNotes: false,
    showSensoryNotes: false,
    showGeneralArea: false,
    showExactAddress: false,
    showLocationButton: true,
    showWhatsAppButton: true,
    showCallButton: true,
    showMessageButton: true,
    allowCall: true,
    allowWhatsApp: true,
    allowMessage: true,
    allowLocationSharing: true,
    allowFoundReport: true,
    isPublic: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    deletedAt: null,
    ...overrides,
  } as Profile;

  return {
    ...base,
    contacts: contacts.map((contact, index) => ({
      id: `contact_${index}`,
      profileId: base.id,
      name: "Camila Demo",
      relationship: "Madre",
      phone: "+56988880001",
      email: "camila@example.test",
      availabilityNotes: "Principal.",
      whatsappEnabled: true,
      callEnabled: true,
      messageEnabled: true,
      priority: index + 1,
      isVisible: true,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      type: index === 0 ? "PRIMARY" : "SECONDARY",
      relationshipCode: index === 0 ? "MOTHER" : "FATHER",
      ...contact,
    })) as EmergencyContact[],
  };
}

describe("buildPublicProfileView", () => {
  it("hides phone text while keeping contact actions available", () => {
    const view = buildPublicProfileView(profile({}, [{}]));

    expect(view.displayName).toBe("Mati");
    expect(view.contacts[0].phone).toBeNull();
    expect(view.contacts[0].callEnabled).toBe(true);
    expect(view.contacts[0].whatsappEnabled).toBe(true);
    expect(JSON.stringify(view)).not.toContain("+56988880001");
    expect(view.allergies).toBe("Mani");
    expect(view.medications).toBeNull();
  });

  it("does not expose legacy pet fields publicly", () => {
    const view = buildPublicProfileView(
      profile({
        type: "PET",
        displayName: "Luna",
        petName: "Luna",
        species: "Perro",
        veterinaryNotes: "Vacunas al dia.",
        showAllergies: true,
        allergies: "No debe mostrarse",
      }),
    );

    expect(view.type).toBe("PERSON");
    expect(view.typeLabel).toBe("Persona");
    expect(view.displayName).toBe("Luna");
    expect(view.helpMessage).not.toMatch(/mascota|tutor/i);
    expect(view.species).toBeNull();
    expect(view.veterinaryNotes).toBeNull();
    expect(view.allergies).toBeNull();
  });

  it("does not expose legacy object fields publicly", () => {
    const view = buildPublicProfileView(
      profile({
        type: "OBJECT",
        displayName: "Llaves",
        objectName: "Llaves",
        objectDescription: "Llavero con cinta azul.",
        returnInstructions: "Coordinar devolucion.",
        showMedicalInfo: true,
      }),
    );

    expect(view.type).toBe("PERSON");
    expect(view.typeLabel).toBe("Persona");
    expect(view.objectName).toBeNull();
    expect(view.objectDescription).toBeNull();
    expect(view.returnInstructions).toBeNull();
    expect(view.bloodType).toBeNull();
  });

  it("honors maximum privacy toggles", () => {
    const view = buildPublicProfileView(
      profile(
        {
          alias: null,
          showPhoto: false,
          showAlias: false,
          showApproximateAge: false,
          showContactNames: false,
          allowCall: false,
          allowWhatsApp: false,
          allowMessage: false,
          allowLocationSharing: false,
          allowFoundReport: false,
          showExactAddress: false,
        },
        [{}],
      ),
    );

    expect(view.photoUrl).toBeNull();
    expect(view.age).toBeNull();
    expect(view.exactAddress).toBeNull();
    expect(view.showLocationButton).toBe(false);
    expect(view.allowFoundReport).toBe(false);
    expect(view.contacts[0].name).toBeNull();
    expect(view.contacts[0].callEnabled).toBe(false);
    expect(view.contacts[0].whatsappEnabled).toBe(false);
  });

  it("uses controlled photo endpoint only for stored authorized photos", () => {
    const hiddenLegacy = buildPublicProfileView(profile({ showPhoto: true, photoStoragePath: null }));
    const visibleStored = buildPublicProfileView(
      profile({
        showPhoto: true,
        photoStoragePath: "users/user_1/profiles/profile_1/random.webp",
        photoUpdatedAt: new Date("2026-07-13T12:00:00.000Z"),
      }),
    );

    expect(hiddenLegacy.photoUrl).toBeNull();
    expect(visibleStored.photoUrl).toBe("/api/public/profile-photo/profile_1?v=1783944000000");
  });

  it("exposes critical information only when the single privacy flag is enabled", () => {
    const hidden = buildPublicProfileView(
      profile({
        criticalInformation: "Puede desorientarse.",
        showCriticalInformation: false,
      }),
    );
    const visible = buildPublicProfileView(
      profile({
        criticalInformation: "Puede desorientarse.",
        showCriticalInformation: true,
      }),
    );

    expect(hidden.criticalInformation).toBeNull();
    expect(visible.criticalInformation).toBe("Puede desorientarse.");
  });
});
