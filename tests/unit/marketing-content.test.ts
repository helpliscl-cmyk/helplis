import { describe, expect, it } from "vitest";
import { HOME_FAQS, HOME_SEO } from "@/lib/marketing/content";

describe("contenido comercial", () => {
  it("publica metadata con precio de entrada y compra única", () => {
    expect(HOME_SEO.title).toContain("desde $18.000");
    expect(HOME_SEO.description).toContain("Compra única");
    expect(HOME_SEO.description).toContain("sin mensualidad");
    expect(HOME_SEO.description).toContain("Envío se paga aparte");
  });

  it("FAQ cubre precio, mensualidad, envío, GPS, batería, NFC e instituciones", () => {
    const faqs = HOME_FAQS.map((faq) => `${faq.question} ${faq.answer}`).join("\n");

    expect(faqs).toContain("No. HelPlis se compra una sola vez");
    expect(faqs).toContain("El envío se paga aparte");
    expect(faqs).toContain("1 pulsera: $18.000");
    expect(faqs).toContain("Pack 2: $28.000");
    expect(faqs).toContain("Pack 3: $35.000");
    expect(faqs).toContain("no contiene GPS");
    expect(faqs).toContain("sin batería");
    expect(faqs).toContain("código QR");
    expect(faqs).toContain("alianza institucional");
  });
});
