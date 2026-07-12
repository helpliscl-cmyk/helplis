import { describe, expect, it } from "vitest";
import { calculateOrderTotals } from "@/server/operations/orders";

describe("order totals", () => {
  it("keeps official pack prices and adds manual shipping only to total", () => {
    expect(calculateOrderTotals("1", 0)).toMatchObject({ quantity: 1, subtotal: 18_000, total: 18_000 });
    expect(calculateOrderTotals("2", 2500)).toMatchObject({ quantity: 2, subtotal: 28_000, shippingCost: 2500, total: 30_500 });
    expect(calculateOrderTotals("3", 0)).toMatchObject({ quantity: 3, subtotal: 35_000, total: 35_000 });
  });
});
