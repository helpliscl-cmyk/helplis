export type PackId = "1" | "2" | "3";

export type HelplisPack = {
  id: PackId;
  name: string;
  shortName: string;
  quantity: number;
  totalPrice: number;
  badge?: string;
  cta: string;
};

export const BASE_UNIT_PRICE = 18_000;

export const HELPLIS_PACKS: HelplisPack[] = [
  {
    id: "1",
    name: "1 Pulsera HelPlis",
    shortName: "Pack 1",
    quantity: 1,
    totalPrice: 18_000,
    cta: "Elegir 1 pulsera",
  },
  {
    id: "2",
    name: "Pack 2 HelPlis",
    shortName: "Pack 2",
    quantity: 2,
    totalPrice: 28_000,
    badge: "Mejor relación precio",
    cta: "Elegir pack de 2",
  },
  {
    id: "3",
    name: "Pack 3 HelPlis",
    shortName: "Pack 3",
    quantity: 3,
    totalPrice: 35_000,
    badge: "Mayor ahorro",
    cta: "Elegir pack de 3",
  },
];

export function formatCLP(value: number) {
  return `$${Math.round(value).toLocaleString("es-CL")}`;
}

export function normalizePackId(value: FormDataEntryValue | string | number | null | undefined): PackId {
  const raw = String(value ?? "1").trim().replace(/^pack-/i, "");
  if (raw === "2" || raw === "3") return raw;
  return "1";
}

export function getHelplisPack(value: FormDataEntryValue | string | number | null | undefined) {
  const id = normalizePackId(value);
  return HELPLIS_PACKS.find((pack) => pack.id === id) ?? HELPLIS_PACKS[0];
}

export function getPackSavings(pack: Pick<HelplisPack, "quantity" | "totalPrice">) {
  return BASE_UNIT_PRICE * pack.quantity - pack.totalPrice;
}

export function getPackUnitPrice(pack: Pick<HelplisPack, "quantity" | "totalPrice">) {
  return Math.round(pack.totalPrice / pack.quantity);
}

export function getPackHref(packId: PackId, source = "pricing_card") {
  return `/quiero-helplis?pack=${packId}&source=${encodeURIComponent(source)}`;
}

export function getPackAnalyticsMetadata(pack: HelplisPack, origin: string) {
  return {
    pack: pack.id,
    quantity: pack.quantity,
    price: pack.totalPrice,
    origin,
  };
}

export function buildWhatsAppOrderMessage({
  name,
  commune,
  pack,
}: {
  name: string;
  commune: string;
  pack: HelplisPack;
}) {
  const safeName = name.trim().replace(/\s+/g, " ");
  const safeCommune = commune.trim().replace(/\s+/g, " ");

  return `Hola, soy ${safeName}. Me interesa comprar ${pack.name} (${pack.quantity} ${pack.quantity === 1 ? "pulsera" : "pulseras"}) de HelPlis por ${formatCLP(pack.totalPrice)}. Mi comuna es ${safeCommune}. Quiero coordinar la compra.`;
}

export function buildWhatsAppOrderUrl(input: { name: string; commune: string; pack: HelplisPack; phoneE164: string }) {
  const phone = input.phoneE164.replace("+", "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(buildWhatsAppOrderMessage(input))}`;
}
