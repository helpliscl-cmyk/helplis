import { describe, expect, it } from "vitest";
import { activationInputSchema } from "@/server/services/activation";

const baseInput = {
  publicCode: "HLP009",
  activationCode: "ACT-HLP009",
  ownerName: "Responsable Demo",
  ownerPhoneLocal: "12345678",
  email: "responsable@example.test",
  password: "HelPlisDemo123!",
  termsAccepted: true,
  administrationConsent: true,
  profileType: "CHILD",
  displayName: "Mateo",
  helpMessage: "Contacta a mi adulto responsable.",
  contactName: "Camila",
  contactPhoneLocal: "11112222",
  contactRelationshipCode: "MOTHER",
  contactCallEnabled: true,
  contactWhatsappEnabled: true,
  contact2Name: "Diego",
  contact2PhoneLocal: "33334444",
  contact2RelationshipCode: "FATHER",
  contact2CallEnabled: true,
  contact2WhatsappEnabled: true,
  showPhoto: true,
  showDisplayName: true,
  allowCall: true,
  allowWhatsApp: true,
  allowLocationSharing: true,
  allowFoundReport: true,
  showCriticalInformation: false,
};

describe("people-first activation schema", () => {
  it("accepts the simplified people activation payload with two contacts", () => {
    const parsed = activationInputSchema.parse(baseInput);

    expect(parsed.ownerPhoneLocal).toBe("12345678");
    expect(parsed.contactRelationshipCode).toBe("MOTHER");
    expect(parsed.contact2RelationshipCode).toBe("FATHER");
    expect(parsed.showCriticalInformation).toBe(false);
  });

  it("requires exactly eight local digits after +569", () => {
    expect(activationInputSchema.safeParse({ ...baseInput, contactPhoneLocal: "912345678" }).success).toBe(false);
    expect(activationInputSchema.safeParse({ ...baseInput, ownerPhoneLocal: "1234abcd" }).success).toBe(false);
  });

  it("requires a secondary contact in the initial flow", () => {
    const input = { ...baseInput, contact2Name: "" };

    expect(activationInputSchema.safeParse(input).success).toBe(false);
  });

  it("does not allow showing empty critical information", () => {
    const input = { ...baseInput, showCriticalInformation: true };

    expect(activationInputSchema.safeParse(input).success).toBe(false);
  });

  it("allows a single critical information block when explicitly authorized", () => {
    const input = {
      ...baseInput,
      criticalInformation: "Puede desorientarse y necesita permanecer acompanado.",
      showCriticalInformation: true,
    };

    expect(activationInputSchema.safeParse(input).success).toBe(true);
  });

  it("accepts photo payload size compatible with a 5 MB original image", () => {
    const photoDataUrl = `data:image/png;base64,${"A".repeat(1_500_000)}`;

    expect(activationInputSchema.safeParse({ ...baseInput, photoDataUrl }).success).toBe(true);
  });
});
