export const PRIMARY_USE_OPTIONS = [
  { value: "niño", label: "Niño" },
  { value: "adulto_mayor", label: "Adulto mayor" },
  { value: "persona_asistencia", label: "Persona que necesita asistencia" },
  { value: "mascota", label: "Mascota" },
  { value: "equipaje", label: "Equipaje" },
  { value: "objeto", label: "Objeto" },
  { value: "institución", label: "Institución" },
  { value: "otro", label: "Otro" },
] as const;

export const PURCHASE_INTENT_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUOTED",
  "PAYMENT_PENDING",
  "PAID",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "LOST",
] as const;

export const HOME_FAQS = [
  {
    question: "¿Tiene costo mensual?",
    answer: "No. HelPlis se compra una sola vez y no tiene mensualidad obligatoria.",
  },
  {
    question: "¿El envío está incluido?",
    answer: "No. El envío se paga aparte y su costo depende del destino.",
  },
  {
    question: "¿Cuánto cuesta?",
    answer: "1 pulsera: $18.000. Pack 2: $28.000. Pack 3: $35.000.",
  },
  {
    question: "¿Puedo cambiar la información después?",
    answer: "Sí. La información del perfil puede actualizarse sin cambiar la pulsera.",
  },
  {
    question: "¿Tiene GPS?",
    answer:
      "No. La pulsera no contiene GPS ni realiza rastreo permanente. La persona que la escanea puede compartir voluntariamente la ubicación de su teléfono.",
  },
  {
    question: "¿Necesita batería?",
    answer: "No. El QR y el NFC funcionan sin batería interna ni carga eléctrica.",
  },
  {
    question: "¿Necesita aplicación?",
    answer: "No. La ficha pública se abre desde el navegador del teléfono.",
  },
  {
    question: "¿Qué pasa si el teléfono no tiene NFC?",
    answer: "Puede escanear el código QR visible en la pulsera.",
  },
  {
    question: "¿Puedo comprar varias?",
    answer: "Sí. Existen packs de 2 y 3 pulseras con mejor precio por unidad.",
  },
  {
    question: "¿Puedo comprar para un colegio o institución?",
    answer: "Sí. Existe la opción de alianza institucional según cantidad.",
  },
] as const;

export const HOME_SEO = {
  title: "HelPlis | Pulsera inteligente QR + NFC desde $18.000",
  description:
    "Pulsera inteligente con QR y NFC para personas, niños, adultos mayores, mascotas y objetos. Compra única, sin batería y sin mensualidad. Envío se paga aparte.",
} as const;
