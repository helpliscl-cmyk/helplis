import type { EmergencyContact, Profile, ProfileType } from "@prisma/client";

const PERSON_PROFILE_TYPES = new Set<ProfileType>([
  "PERSON",
  "CHILD",
  "SENIOR",
  "DEPENDENT_PERSON",
  "MEDICAL_PROFILE",
]);

export const PROFILE_TYPE_LABELS: Record<ProfileType, string> = {
  PERSON: "Persona",
  CHILD: "Nino",
  SENIOR: "Adulto mayor",
  DEPENDENT_PERSON: "Persona con apoyo",
  MEDICAL_PROFILE: "Perfil medico",
  PET: "Mascota",
  LUGGAGE: "Equipaje",
  OBJECT: "Objeto",
  ASSET: "Activo",
  EMPLOYEE: "Colaborador",
  OTHER: "Otro",
};

export const HELP_MESSAGE_TEMPLATES: Partial<Record<ProfileType, string>> = {
  CHILD:
    "Estoy con una pulsera HelPlis. Por favor contacta a mi adulto responsable y acompaname en un lugar seguro.",
  SENIOR: "Puedo necesitar orientacion. Por favor hablame con calma y contacta a mi responsable.",
  DEPENDENT_PERSON:
    "Puedo requerir apoyo para comunicarme o desplazarme. Revisa las indicaciones autorizadas y contacta a mi red.",
  MEDICAL_PROFILE:
    "Revisa la informacion autorizada y contacta al responsable antes de tomar decisiones no urgentes.",
  PET: "Soy una mascota con identificacion HelPlis. Por favor avisa a mi tutor antes de trasladarme.",
  LUGGAGE:
    "Este objeto tiene identificacion HelPlis. Por favor avisa al responsable para coordinar la devolucion.",
  OBJECT:
    "Este objeto tiene identificacion HelPlis. Por favor avisa al responsable para coordinar la devolucion.",
  ASSET:
    "Este activo tiene identificacion HelPlis. Por favor avisa al responsable para coordinar la devolucion.",
  PERSON:
    "Este HelPlis contiene informacion autorizada para contactar a mi red de apoyo si necesito ayuda.",
  OTHER:
    "Este HelPlis contiene informacion autorizada para ayudar a contactar a su responsable.",
};

export type PublicContactView = {
  id: string;
  name: string | null;
  relationship: string | null;
  availabilityNotes: string | null;
  phone: string | null;
  email: string | null;
  whatsappEnabled: boolean;
  callEnabled: boolean;
  messageEnabled: boolean;
  priority: number;
};

export type PublicProfileView = {
  type: ProfileType;
  typeLabel: string;
  displayName: string;
  alias: string | null;
  photoUrl: string | null;
  headline: string | null;
  helpMessage: string;
  description: string | null;
  statusMessage: string | null;
  medicalNotes: string | null;
  allergies: string | null;
  medications: string | null;
  bloodType: string | null;
  specialInstructions: string | null;
  medicalConditions: string | null;
  medicalInstructions: string | null;
  emergencyInstructions: string | null;
  communicationNotes: string | null;
  mobilityNotes: string | null;
  sensoryNotes: string | null;
  age: number | null;
  approximateAge: number | null;
  country: string | null;
  region: string | null;
  commune: string | null;
  generalArea: string | null;
  exactAddress: string | null;
  species: string | null;
  petName: string | null;
  breed: string | null;
  color: string | null;
  sex: string | null;
  veterinaryNotes: string | null;
  microchipNumberOptional: string | null;
  petBehaviorNotes: string | null;
  objectName: string | null;
  objectCategory: string | null;
  brand: string | null;
  model: string | null;
  objectDescription: string | null;
  rewardMessage: string | null;
  returnInstructions: string | null;
  lostMessage: string | null;
  showLocationButton: boolean;
  showWhatsAppButton: boolean;
  showCallButton: boolean;
  showMessageButton: boolean;
  allowFoundReport: boolean;
  contacts: PublicContactView[];
};

export function buildPublicProfileView(
  profile: Profile & { contacts: EmergencyContact[] },
  currentYear = new Date().getFullYear(),
): PublicProfileView {
  const isPerson = PERSON_PROFILE_TYPES.has(profile.type);
  const canShowLegacyMedical = isPerson && profile.showMedicalInfo;
  const computedAge = profile.approximateAge ?? (profile.birthYear ? currentYear - profile.birthYear : null);
  const allowCall = profile.allowCall && profile.showCallButton;
  const allowWhatsApp = profile.allowWhatsApp && profile.showWhatsAppButton;
  const allowMessage = profile.allowMessage && profile.showMessageButton;

  return {
    type: profile.type,
    typeLabel: PROFILE_TYPE_LABELS[profile.type],
    displayName: visibleName(profile),
    alias: cleanText(profile.alias),
    photoUrl: profile.showPhoto ? cleanUrl(profile.photoUrl) : null,
    headline: cleanText(profile.headline),
    helpMessage: cleanText(profile.helpMessage) ?? HELP_MESSAGE_TEMPLATES[profile.type] ?? HELP_MESSAGE_TEMPLATES.OTHER!,
    description: cleanText(profile.description),
    statusMessage: cleanText(profile.statusMessage),
    medicalNotes: canShowLegacyMedical ? cleanText(profile.medicalNotes) : null,
    allergies:
      isPerson && (profile.showAllergies || profile.showMedicalInfo) ? cleanText(profile.allergies) : null,
    medications:
      isPerson && (profile.showMedications || profile.showMedicalInfo) ? cleanText(profile.medications) : null,
    bloodType:
      isPerson && (profile.showBloodType || profile.showMedicalInfo) ? cleanText(profile.bloodType) : null,
    specialInstructions: cleanText(profile.specialInstructions),
    medicalConditions:
      isPerson && (profile.showMedicalConditions || profile.showMedicalInfo)
        ? cleanText(profile.medicalConditions)
        : null,
    medicalInstructions:
      isPerson && (profile.showMedicalInstructions || profile.showMedicalInfo)
        ? cleanText(profile.medicalInstructions ?? profile.specialInstructions)
        : null,
    emergencyInstructions:
      isPerson && (profile.showMedicalInstructions || profile.showMedicalInfo)
        ? cleanText(profile.emergencyInstructions)
        : null,
    communicationNotes: isPerson && profile.showCommunicationNotes ? cleanText(profile.communicationNotes) : null,
    mobilityNotes: isPerson && profile.showMobilityNotes ? cleanText(profile.mobilityNotes) : null,
    sensoryNotes: isPerson && profile.showSensoryNotes ? cleanText(profile.sensoryNotes) : null,
    age: (profile.showApproximateAge || profile.showAge) && isPerson ? computedAge : null,
    approximateAge: profile.showApproximateAge && isPerson ? computedAge : null,
    country: cleanText(profile.country),
    region: cleanText(profile.region),
    commune: profile.showGeneralArea ? cleanText(profile.commune) : null,
    generalArea: profile.showGeneralArea ? cleanText(profile.generalArea) : null,
    exactAddress: profile.showExactAddress ? cleanText(profile.exactAddress) : null,
    species: profile.type === "PET" ? cleanText(profile.species) : null,
    petName: profile.type === "PET" ? cleanText(profile.petName ?? profile.displayName) : null,
    breed: profile.type === "PET" ? cleanText(profile.breed) : null,
    color: cleanText(profile.color),
    sex: profile.type === "PET" ? cleanText(profile.sex) : null,
    veterinaryNotes: profile.type === "PET" ? cleanText(profile.veterinaryNotes) : null,
    microchipNumberOptional: profile.type === "PET" ? cleanText(profile.microchipNumberOptional) : null,
    petBehaviorNotes: profile.type === "PET" ? cleanText(profile.petBehaviorNotes) : null,
    objectName: isObjectProfile(profile.type) ? cleanText(profile.objectName ?? profile.displayName) : null,
    objectCategory: isObjectProfile(profile.type) ? cleanText(profile.objectCategory) : null,
    brand: isObjectProfile(profile.type) ? cleanText(profile.brand) : null,
    model: isObjectProfile(profile.type) ? cleanText(profile.model) : null,
    objectDescription: isObjectProfile(profile.type) ? cleanText(profile.objectDescription ?? profile.description) : null,
    rewardMessage: isObjectProfile(profile.type) || profile.type === "PET" ? cleanText(profile.rewardMessage) : null,
    returnInstructions: isObjectProfile(profile.type) ? cleanText(profile.returnInstructions) : null,
    lostMessage: cleanText(profile.lostMessage),
    showLocationButton: profile.allowLocationSharing && profile.showLocationButton,
    showWhatsAppButton: allowWhatsApp,
    showCallButton: allowCall,
    showMessageButton: allowMessage,
    allowFoundReport: profile.allowFoundReport,
    contacts: profile.contacts.map((contact) =>
      buildPublicContactView(contact, {
        showNames: profile.showContactNames,
        showPhoneNumbers: profile.showPhoneNumbers,
        allowCall,
        allowWhatsApp,
        allowMessage,
      }),
    ),
  };
}

function buildPublicContactView(
  contact: EmergencyContact,
  options: {
    showNames: boolean;
    showPhoneNumbers: boolean;
    allowCall: boolean;
    allowWhatsApp: boolean;
    allowMessage: boolean;
  },
): PublicContactView {
  const normalizedPhone = normalizePhone(contact.phone);
  return {
    id: contact.id,
    name: options.showNames ? cleanText(contact.name) : null,
    relationship: options.showNames ? cleanText(contact.relationship) : null,
    availabilityNotes: cleanText(contact.availabilityNotes),
    phone: options.showPhoneNumbers ? normalizedPhone : null,
    email: cleanText(contact.email),
    whatsappEnabled: Boolean(normalizedPhone) && options.allowWhatsApp && contact.whatsappEnabled,
    callEnabled: Boolean(normalizedPhone) && options.allowCall && contact.callEnabled,
    messageEnabled: Boolean(normalizedPhone) && options.allowMessage && contact.messageEnabled,
    priority: contact.priority,
  };
}

function visibleName(profile: Profile) {
  if (profile.type === "PET") {
    return cleanText(profile.petName ?? profile.alias ?? profile.displayName) ?? "Mascota HelPlis";
  }

  if (isObjectProfile(profile.type)) {
    return cleanText(profile.objectName ?? profile.alias ?? profile.displayName) ?? "Objeto HelPlis";
  }

  if (profile.showFullName) {
    const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim();
    return cleanText(fullName || profile.legalName || profile.displayName) ?? "Perfil HelPlis";
  }

  if (profile.showAlias && profile.alias) return cleanText(profile.alias) ?? "Perfil HelPlis";
  return cleanText(profile.firstName ?? profile.displayName) ?? "Perfil HelPlis";
}

function isObjectProfile(type: ProfileType) {
  return type === "LUGGAGE" || type === "OBJECT" || type === "ASSET";
}

export function normalizePhone(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!/^\+?[\d\s().-]{7,24}$/.test(trimmed)) return null;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  return trimmed.startsWith("+") ? `+${digits}` : digits;
}

function cleanText(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;
  const withoutTags = trimmed.replace(/<[^>]*>/g, "");
  if (/javascript:|data:text\/html|vbscript:/i.test(withoutTags)) return null;
  return withoutTags.slice(0, 700);
}

function cleanUrl(value: string | null | undefined) {
  const cleaned = cleanText(value);
  if (!cleaned) return null;
  if (/^(https?:\/\/|\/)/i.test(cleaned)) return cleaned;
  return null;
}
