export const PRIMARY_USE_OPTIONS = [
  { value: "nino", label: "Nino" },
  { value: "adulto_mayor", label: "Adulto mayor" },
  { value: "persona_asistencia", label: "Persona que requiere asistencia" },
  { value: "dificultad_comunicacion", label: "Persona con dificultad para comunicarse" },
  { value: "institucion", label: "Institucion" },
  { value: "otro_personas", label: "Otro uso para personas" },
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
    question: "Tiene costo mensual?",
    answer: "No. HelPlis se compra una sola vez y no tiene mensualidad obligatoria.",
  },
  {
    question: "Cuanto cuesta?",
    answer: "1 pulsera: $18.000. Pack 2: $28.000. Pack 3: $35.000.",
  },
  {
    question: "Puedo cambiar la informacion despues?",
    answer: "Si. La informacion del perfil puede actualizarse sin cambiar la pulsera.",
  },
  {
    question: "Tiene GPS?",
    answer:
      "No. La pulsera no contiene GPS ni realiza rastreo permanente. La persona que la escanea puede compartir voluntariamente la ubicacion de su telefono.",
  },
  {
    question: "Necesita bateria?",
    answer: "No. El QR y el NFC funcionan sin bateria interna ni carga electrica.",
  },
  {
    question: "Necesita aplicacion?",
    answer: "No es obligatorio instalar una aplicacion. La ficha publica se abre desde el navegador del telefono.",
  },
  {
    question: "Que pasa si el telefono no tiene NFC?",
    answer: "Puede escanear el codigo QR visible en la pulsera.",
  },
  {
    question: "Puedo comprar varias?",
    answer: "Si. Existen packs de 2 y 3 pulseras con mejor precio por unidad.",
  },
  {
    question: "Puedo comprar para un colegio o institucion?",
    answer: "Si. Existe la opcion de alianza institucional segun cantidad.",
  },
] as const;

export const HOME_SEO = {
  title: "HelPlis | Pulsera inteligente QR + NFC desde $18.000",
  description:
    "Pulsera inteligente con QR y NFC para ninos, adultos mayores y personas que pueden requerir apoyo. Compra unica, sin bateria y sin mensualidad.",
} as const;
