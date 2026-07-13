import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseMimeHtml } from "@/server/mime/parser";
import { buildMimeUrl, DEFAULT_MIME_BASE_URL } from "@/server/mime/types";

function fixture(name: string) {
  return readFileSync(join(process.cwd(), "tests", "fixtures", "mime", name), "utf8");
}

describe("parser MIME", () => {
  it("construye la URL vigente desde una base centralizada", () => {
    expect(buildMimeUrl(2123)).toBe("https://mi.mineduc.cl/mime-web/mvc/mime/ficha?rbd=2123");
    expect(buildMimeUrl(2123, `${DEFAULT_MIME_BASE_URL}/`)).toBe(
      "https://mi.mineduc.cl/mime-web/mvc/mime/ficha?rbd=2123",
    );
  });

  it("extrae una ficha completa y normaliza datos", () => {
    const result = parseMimeHtml(fixture("complete.html"), 8927);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.rbd).toBe(8927);
    expect(result.data.name).toBe("Liceo Demo Completo");
    expect(result.data.contactEmail).toBe("contacto@liceodemo.cl");
    expect(result.data.contacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          email: "contacto@liceodemo.cl",
          contactType: "ESTABLISHMENT_GENERAL",
          sourceUrl: buildMimeUrl(8927),
        }),
      ]),
    );
    expect(result.data.phone).toBe("+5632036851");
    expect(result.data.totalEnrollment).toBe(540);
    expect(result.data.averageStudentsPerCourse).toBe(30);
    expect(result.data.contentHash).toHaveLength(64);
  });

  it("guarda Sin información como nulo", () => {
    const noEmail = parseMimeHtml(fixture("no-email.html"), 5611);
    const noPhone = parseMimeHtml(fixture("no-phone.html"), 10686);
    expect(noEmail.ok && noEmail.data.contactEmail).toBeNull();
    expect(noPhone.ok && noPhone.data.phone).toBeNull();
  });

  it("detecta ficha inexistente", () => {
    const result = parseMimeHtml(fixture("not-found.html"), 999999);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errorType).toBe("NOT_FOUND");
  });

  it("detecta HTML de error genérico MIME con HTTP 200", () => {
    const result = parseMimeHtml(fixture("mime-error.html"), 2112);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errorType).toBe("MIME_ERROR_PAGE");
  });

  it("clasifica multiples correos y no promueve correos genericos de Mineduc", () => {
    const result = parseMimeHtml(fixture("multiple-emails.html"), 7001);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.contactEmail).toBe("contacto@colegiomulti.cl");
    expect(result.data.averageStudentsPerCourse).toBe(31);
    expect(result.data.contacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ email: "contacto@colegiomulti.cl", contactType: "ESTABLISHMENT_GENERAL" }),
        expect.objectContaining({ email: "direccion@colegiomulti.cl", contactType: "DIRECTOR" }),
        expect.objectContaining({ email: "padres@colegiomulti.cl", contactType: "PARENTS_CENTER" }),
        expect.objectContaining({ email: "alumnos@colegiomulti.cl", contactType: "STUDENT_CENTER" }),
        expect.objectContaining({ email: "consejo@colegiomulti.cl", contactType: "SCHOOL_COUNCIL" }),
        expect.objectContaining({ email: "ayuda@mineduc.cl", contactType: "GENERIC_MINEDUC" }),
      ]),
    );
    expect(result.data.contactEmail).not.toBe("ayuda@mineduc.cl");
  });

  it("normaliza una URL sin protocolo", () => {
    const result = parseMimeHtml(fixture("url-without-protocol.html"), 7002);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.website).toBe("https://colegiosinprotocolo.cl");
  });

  it("conserva telefonos multiples normalizados", () => {
    const result = parseMimeHtml(fixture("multiple-phone.html"), 7003);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.phone).toBe("+5672222222 / +56987654321");
  });

  it("detecta estructura inesperada", () => {
    const result = parseMimeHtml(fixture("unexpected.html"));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errorType).toBe("UNEXPECTED_STRUCTURE");
  });

  it("cambia el hash cuando cambian datos relevantes", () => {
    const initial = parseMimeHtml(fixture("complete.html"), 8927);
    const changed = parseMimeHtml(fixture("changed.html"), 8927);
    expect(initial.ok && changed.ok && initial.data.contentHash !== changed.data.contentHash).toBe(true);
  });
});
