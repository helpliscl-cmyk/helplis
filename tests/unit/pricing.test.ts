import { describe, expect, it } from "vitest";
import {
  buildWhatsAppOrderMessage,
  formatCLP,
  getHelplisPack,
  getPackSavings,
  getPackUnitPrice,
} from "@/lib/marketing/pricing";

describe("pricing HelPlis", () => {
  it("calcula pack 1", () => {
    const pack = getHelplisPack("1");
    expect(pack.quantity).toBe(1);
    expect(pack.totalPrice).toBe(18_000);
    expect(getPackUnitPrice(pack)).toBe(18_000);
    expect(getPackSavings(pack)).toBe(0);
  });

  it("calcula pack 2 y ahorro", () => {
    const pack = getHelplisPack("2");
    expect(pack.quantity).toBe(2);
    expect(pack.totalPrice).toBe(28_000);
    expect(getPackUnitPrice(pack)).toBe(14_000);
    expect(getPackSavings(pack)).toBe(8_000);
  });

  it("calcula pack 3 y ahorro", () => {
    const pack = getHelplisPack("3");
    expect(pack.quantity).toBe(3);
    expect(pack.totalPrice).toBe(35_000);
    expect(getPackUnitPrice(pack)).toBe(11_667);
    expect(getPackSavings(pack)).toBe(19_000);
  });

  it("normaliza query param de pack", () => {
    expect(getHelplisPack("pack-2").id).toBe("2");
    expect(getHelplisPack("otro").id).toBe("1");
  });

  it("formatea pesos chilenos y WhatsApp sin datos sensibles extra", () => {
    const message = buildWhatsAppOrderMessage({
      name: "Lead Demo",
      commune: "Santiago",
      pack: getHelplisPack("2"),
    });

    expect(formatCLP(28_000)).toBe("$28.000");
    expect(message).toContain("Pack 2 HelPlis");
    expect(message).toContain("$28.000");
    expect(message).toContain("envío se paga aparte");
    expect(message).not.toContain("@");
  });
});
