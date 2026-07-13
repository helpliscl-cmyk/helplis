import { load } from "cheerio";
import {
  emptyToNull,
  normalizeEmail,
  normalizeForMatch,
  normalizePhoneChile,
  normalizeWebsite,
  normalizeWhitespace,
  parseInteger,
  parseNumber,
  parseRbd,
  stableHash,
} from "@/server/mime/normalization";
import { buildMimeUrl, MIME_SOURCE, type MimeContactData, type MimeContactType, type MimeEstablishmentData, type MimeParseResult } from "@/server/mime/types";

const FIELD_LABELS = {
  name: ["Nombre", "Nombre establecimiento", "Establecimiento", "Nombre del establecimiento"],
  status: ["Estado", "Estado del establecimiento"],
  region: ["Región", "Region"],
  province: ["Provincia"],
  commune: ["Comuna"],
  address: ["Dirección", "Direccion"],
  latitude: ["Latitud"],
  longitude: ["Longitud"],
  dependency: ["Dependencia", "Tipo dependencia"],
  officialRecognition: ["Reconocimiento oficial", "Reconocimiento Oficial"],
  educationLevels: ["Niveles de enseñanza", "Niveles de ensenanza", "Enseñanza", "Ensenanza"],
  totalEnrollment: ["Matrícula total", "Matricula total", "Matrícula total de alumnos", "Matricula total de alumnos", "Matrícula", "Matricula"],
  averageStudentsPerCourse: ["Promedio alumnos por curso", "Promedio de alumnos por curso", "Alumnos por curso"],
  directorName: ["Director o directora", "Director / Directora", "Director(a)", "Directora", "Director"],
  holderName: ["Sostenedor", "Nombre sostenedor", "Nombre del sostenedor"],
  phone: ["Teléfono", "Telefono", "Fono"],
  contactEmail: ["E-mail contacto", "Email contacto", "Correo de contacto", "Correo electrónico", "Correo electronico"],
  website: ["Página web", "Pagina web", "Sitio web", "Web"],
  rbd: ["RBD", "Rbd"],
};

const KNOWN_LABELS = Object.values(FIELD_LABELS)
  .flat()
  .sort((left, right) => right.length - left.length);
const EMAIL_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/giu;

function labelKey(value: string) {
  return normalizeForMatch(value);
}

function putLabel(labels: Map<string, string>, label: string, value: string) {
  const cleanLabel = emptyToNull(label);
  const cleanValue = emptyToNull(value);
  if (!cleanLabel || !cleanValue) return;
  const key = labelKey(cleanLabel);
  if (!labels.has(key)) labels.set(key, cleanValue);
}

function elementValueText($: ReturnType<typeof load>, element: Parameters<ReturnType<typeof load>>[0]) {
  const node = $(element);
  const mailto = node.find("a[href^='mailto:']").first().attr("href");
  if (mailto) return mailto;
  const href = node.find("a[href]").first().attr("href");
  const text = normalizeWhitespace(node.text());
  return text || href || "";
}

function collectStructuredLabels(html: string) {
  const $ = load(html);
  const labels = new Map<string, string>();

  $("script, style, noscript").remove();

  $("dt").each((_, element) => {
    putLabel(labels, $(element).text(), elementValueText($, $(element).next("dd")));
  });

  $("tr").each((_, row) => {
    const cells = $(row).find("th,td").toArray();
    if (cells.length >= 2) putLabel(labels, $(cells[0]).text(), elementValueText($, cells[1]));
  });

  $("li, p, div, span").each((_, element) => {
    const text = normalizeWhitespace($(element).clone().children().remove().end().text());
    const match = text.match(/^([^:：]{2,80})[:：]\s*(.+)$/);
    if (match) putLabel(labels, match[1], match[2]);
  });

  const rawText = $("body").text().replace(/\r/g, "\n");
  for (const line of rawText.split(/\n+/)) {
    const text = normalizeWhitespace(line);
    const match = text.match(/^([^:：]{2,80})[:：]\s*(.+)$/);
    if (match) putLabel(labels, match[1], match[2]);
  }

  const compactText = normalizeWhitespace(rawText);
  const labelAlternation = KNOWN_LABELS.map(escapeRegExp).join("|");
  for (const label of KNOWN_LABELS) {
    const pattern = new RegExp(
      `${escapeRegExp(label)}\\s*[:：]\\s*(.*?)(?=\\s+(?:${labelAlternation})\\s*[:：]|$)`,
      "iu",
    );
    const match = compactText.match(pattern);
    if (match) putLabel(labels, label, match[1]);
  }

  return { $, labels };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readField(labels: Map<string, string>, variants: string[]) {
  for (const variant of variants) {
    const direct = labels.get(labelKey(variant));
    if (direct) return direct;
  }

  for (const [key, value] of labels.entries()) {
    if (variants.some((variant) => key.includes(labelKey(variant)))) return value;
  }

  return null;
}

function readName(html: string, labels: Map<string, string>) {
  const labeledName = readField(labels, FIELD_LABELS.name);
  if (labeledName) return emptyToNull(labeledName);

  const $ = load(html);
  $("script, style, noscript").remove();
  const candidates = [
    ...$("[class*='nombre'], [id*='nombre'], [class*='titulo'], [id*='titulo']")
      .toArray()
      .map((element) => $(element).text()),
    ...$("h1,h2,h3").toArray().map((element) => $(element).text()),
    $("title").text(),
  ];

  return (
    candidates
      .map(emptyToNull)
      .find((value) => value && !/mime|ministerio|mapa|ficha/i.test(value)) ?? null
  );
}

function toLabeledData(labels: Map<string, string>) {
  return [...labels.entries()].reduce<Record<string, string>>((accumulator, [key, value]) => {
    accumulator[key] = value;
    return accumulator;
  }, {});
}

function classifyEmail(label: string | null, section: string | null, email: string): MimeContactType {
  const text = normalizeForMatch(`${section ?? ""} ${label ?? ""} ${email}`);
  const domain = email.split("@").at(1) ?? "";
  if (/mineduc|ayudamineduc|ministerio/.test(text) || /mineduc\.cl$/i.test(domain)) return "GENERIC_MINEDUC";
  if (/centro de padres|padres y apoderados|apoderados/.test(text)) return "PARENTS_CENTER";
  if (/centro de alumnos|estudiantes|alumnos/.test(text)) return "STUDENT_CENTER";
  if (/consejo escolar/.test(text)) return "SCHOOL_COUNCIL";
  if (/sostenedor/.test(text)) return "HOLDER";
  if (/director|directora|direccion/.test(text)) return "DIRECTOR";
  if (/contacto|correo|e mail|email|establecimiento|institucional/.test(text)) return "ESTABLISHMENT_GENERAL";
  return "UNKNOWN";
}

function extractEmails(value: string | null | undefined) {
  const matches = normalizeWhitespace(value).match(EMAIL_PATTERN) ?? [];
  return [...new Set(matches.map((match) => normalizeEmail(match)).filter((email): email is string => Boolean(email)))];
}

function nearestSection($: ReturnType<typeof load>, element: Parameters<ReturnType<typeof load>>[0]) {
  const node = $(element);
  return emptyToNull(node.closest("section, article, fieldset, div, table").find("h1,h2,h3,h4,legend,caption").first().text());
}

function collectContacts(html: string, labels: Map<string, string>, sourceUrl: string) {
  const contacts = new Map<string, MimeContactData>();

  for (const [label, value] of labels.entries()) {
    for (const email of extractEmails(value)) {
      const contactType = classifyEmail(label, label, email);
      contacts.set(`${email}:${contactType}:${label}`, { email, contactType, label, section: label, sourceUrl });
    }
  }

  const $ = load(html);
  $("a[href^='mailto:']").each((_, element) => {
    const email = normalizeEmail($(element).attr("href"));
    if (!email || !email.includes("@")) return;
    const label = emptyToNull($(element).text());
    const section = nearestSection($, element);
    const contactType = classifyEmail(label, section, email);
    contacts.set(`${email}:${contactType}:${section ?? label ?? ""}`, { email, contactType, label, section, sourceUrl });
  });

  $("p,li,td,dd,span,div").each((_, element) => {
    const text = normalizeWhitespace($(element).text());
    for (const email of extractEmails(text)) {
      const section = nearestSection($, element);
      const label = emptyToNull(text.slice(0, 140));
      const contactType = classifyEmail(label, section, email);
      contacts.set(`${email}:${contactType}:${section ?? label ?? ""}`, { email, contactType, label, section, sourceUrl });
    }
  });

  return [...contacts.values()];
}

function choosePrimaryEmail(contacts: MimeContactData[]) {
  return (
    contacts.find((contact) => contact.contactType === "ESTABLISHMENT_GENERAL") ??
    contacts.find((contact) => contact.contactType === "DIRECTOR") ??
    contacts.find((contact) => contact.contactType === "HOLDER") ??
    null
  );
}

function hasUnexpectedStructure(html: string, labels: Map<string, string>) {
  const text = normalizeForMatch(load(html).text());
  if (/captcha|verifique que no es un robot|acceso denegado/.test(text)) return true;
  return labels.size < 2;
}

function hasMimeErrorPage(html: string) {
  const text = normalizeForMatch(load(html).text());
  return /se produjo un error generico|error generico|numberformatexception|exception/.test(text);
}

function hasMissingPage(html: string, labels: Map<string, string>) {
  const text = normalizeForMatch(load(html).text());
  if (readField(labels, FIELD_LABELS.rbd) || readField(labels, FIELD_LABELS.name)) return false;
  return /no se encontraron|sin resultados|establecimiento no encontrado/.test(text);
}

export function parseMimeHtml(html: string, requestedRbd?: number, checkedAt = new Date()): MimeParseResult {
  const warnings: string[] = [];
  const { labels } = collectStructuredLabels(html);

  if (hasMimeErrorPage(html)) {
    return {
      ok: false,
      errorType: "MIME_ERROR_PAGE",
      errorMessage: "MIME devolvio una pagina de error generico con HTTP 200.",
      warnings,
    };
  }

  if (hasMissingPage(html, labels)) {
    return {
      ok: false,
      errorType: "NOT_FOUND",
      errorMessage: "MIME no entregó una ficha pública para el RBD consultado.",
      warnings,
    };
  }

  if (hasUnexpectedStructure(html, labels)) {
    return {
      ok: false,
      errorType: "UNEXPECTED_STRUCTURE",
      errorMessage: "La ficha MIME no contiene etiquetas suficientes para una extracción confiable.",
      warnings,
    };
  }

  const rbd = parseRbd(readField(labels, FIELD_LABELS.rbd)) ?? requestedRbd ?? null;
  if (!rbd) {
    return {
      ok: false,
      errorType: "UNEXPECTED_STRUCTURE",
      errorMessage: "No se encontró RBD en la ficha MIME.",
      warnings,
    };
  }

  const name = readName(html, labels);
  const website = normalizeWebsite(readField(labels, FIELD_LABELS.website));
  const phone = normalizePhoneChile(readField(labels, FIELD_LABELS.phone));
  const totalEnrollment = parseInteger(readField(labels, FIELD_LABELS.totalEnrollment));
  const averageStudentsPerCourse = parseNumber(readField(labels, FIELD_LABELS.averageStudentsPerCourse));
  const latitude = parseNumber(readField(labels, FIELD_LABELS.latitude));
  const longitude = parseNumber(readField(labels, FIELD_LABELS.longitude));
  const contacts = collectContacts(html, labels, buildMimeUrl(rbd));
  const primaryEmail = choosePrimaryEmail(contacts);

  if (!name) warnings.push("Ficha sin nombre detectable.");
  if (!primaryEmail) warnings.push("Ficha sin correo institucional público.");
  if (!phone) warnings.push("Ficha sin teléfono público.");

  const hashInput = {
    rbd,
    name,
    status: emptyToNull(readField(labels, FIELD_LABELS.status)),
    region: emptyToNull(readField(labels, FIELD_LABELS.region)),
    province: emptyToNull(readField(labels, FIELD_LABELS.province)),
    commune: emptyToNull(readField(labels, FIELD_LABELS.commune)),
    address: emptyToNull(readField(labels, FIELD_LABELS.address)),
    latitude,
    longitude,
    dependency: emptyToNull(readField(labels, FIELD_LABELS.dependency)),
    officialRecognition: emptyToNull(readField(labels, FIELD_LABELS.officialRecognition)),
    educationLevels: emptyToNull(readField(labels, FIELD_LABELS.educationLevels)),
    totalEnrollment,
    averageStudentsPerCourse,
    directorName: emptyToNull(readField(labels, FIELD_LABELS.directorName)),
    holderName: emptyToNull(readField(labels, FIELD_LABELS.holderName)),
    phone,
    contactEmail: primaryEmail?.email ?? null,
    website,
  };

  const data: MimeEstablishmentData = {
    ...hashInput,
    mimeUrl: buildMimeUrl(rbd),
    source: MIME_SOURCE,
    sourceCheckedAt: checkedAt,
    contentHash: stableHash(hashInput),
    labeledData: toLabeledData(labels),
    contacts,
  };

  return { ok: true, data, warnings };
}
