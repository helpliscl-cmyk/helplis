import { describe, expect, it } from "vitest";
import { HOME_FAQS, HOME_SEO, PRIMARY_USE_OPTIONS } from "@/lib/marketing/content";

describe("contenido comercial", () => {
  it("publica metadata con precio de entrada y compra única", () => {
    expect(HOME_SEO.title).toContain("desde $18.000");
    expect(HOME_SEO.description).toContain("Compra unica");
    expect(HOME_SEO.description).toContain("sin mensualidad");
    expect(HOME_SEO.description).not.toContain("Envío");
  });

  it("FAQ cubre precio, mensualidad, GPS, batería, NFC e instituciones", () => {
    const faqs = HOME_FAQS.map((faq) => `${faq.question} ${faq.answer}`).join("\n");

    expect(faqs).toContain("No. HelPlis se compra una sola vez");
    expect(faqs).toContain("1 pulsera: $18.000");
    expect(faqs).toContain("Pack 2: $28.000");
    expect(faqs).toContain("Pack 3: $35.000");
    expect(faqs).toContain("no contiene GPS");
    expect(faqs).toContain("sin bateria");
    expect(faqs).toContain("codigo QR");
    expect(faqs).toContain("alianza institucional");
  });

  it("orienta el formulario comercial a personas", () => {
    const values = PRIMARY_USE_OPTIONS.map((option) => option.value);
    const labels = PRIMARY_USE_OPTIONS.map((option) => option.label).join(" ");

    expect(values).toContain("dificultad_comunicacion");
    expect(labels).toContain("Persona que requiere asistencia");
    expect(labels).not.toMatch(/Mascota|Objeto|Equipaje/i);
  });
});
