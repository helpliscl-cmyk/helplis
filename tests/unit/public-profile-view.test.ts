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
    showFullName: false,
    showAlias: true,
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
      ...contact,
    })) as EmergencyContact[],
  };
}

describe("buildPublicProfileView", () => {
  it("hides phone text while keeping contact actions available", () => {
    const view = buildPublicProfileView(profile({}, [{}]));

    expect(view.displayName).toBe("Mati");
    expect(view.contacts[0].phone).toBeNull();
    expect(view.contacts[0].phoneForAction).toBe("+56988880001");
    expect(view.allergies).toBe("Mani");
    expect(view.medications).toBeNull();
  });

  it("does not expose medical fields for pets", () => {
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

    expect(view.displayName).toBe("Luna");
    expect(view.species).toBe("Perro");
    expect(view.veterinaryNotes).toBe("Vacunas al dia.");
    expect(view.allergies).toBeNull();
  });

  it("uses object fields without medical data", () => {
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

    expect(view.objectName).toBe("Llaves");
    expect(view.objectDescription).toBe("Llavero con cinta azul.");
    expect(view.returnInstructions).toBe("Coordinar devolucion.");
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
    expect(view.contacts[0].phoneForAction).toBeNull();
  });
});
