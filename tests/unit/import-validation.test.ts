import { describe, expect, it } from "vitest";
import { ProductType } from "@prisma/client";
import { validateImportRows } from "@/server/services/import-validation";

describe("validación de importación", () => {
  it("acepta fila válida", () => {
    const [row] = validateImportRows(["ABCD12,https://helplis.cl/p/ABCD12,04:AA,WRISTBAND"]);
    expect(row.isValid).toBe(true);
  });

  it("detecta URL no coincidente", () => {
    const [row] = validateImportRows(["ABCD12,https://helplis.cl/p/OTRO,04:AA,WRISTBAND"]);
    expect(row.errors).toContain("URL no coincidente");
  });

  it("detecta publicCode inválido", () => {
    const [row] = validateImportRows(["@@@,https://helplis.cl/p/@@@,04:AA,WRISTBAND"]);
    expect(row.errors).toContain("publicCode inválido");
  });

  it("detecta duplicados dentro del archivo", () => {
    const rows = validateImportRows([
      "ABCD12,https://helplis.cl/p/ABCD12,04:AA,WRISTBAND",
      "ABCD12,https://helplis.cl/p/ABCD12,04:BB,WRISTBAND",
    ]);
    expect(rows[1].errors).toContain("publicCode duplicado");
  });

  it("detecta UID duplicado dentro del archivo", () => {
    const rows = validateImportRows([
      "ABCD12,https://helplis.cl/p/ABCD12,04:AA,WRISTBAND",
      "EFGH34,https://helplis.cl/p/EFGH34,04:AA,WRISTBAND",
    ]);
    expect(rows[1].errors).toContain("UID NFC duplicado");
  });

  it("detecta duplicados existentes", () => {
    const [row] = validateImportRows(
      ["ABCD12,https://helplis.cl/p/ABCD12,04:AA,WRISTBAND"],
      new Set(["ABCD12"]),
    );
    expect(row.errors).toContain("publicCode duplicado");
  });

  it("detecta UID existente", () => {
    const [row] = validateImportRows(
      ["ABCD12,https://helplis.cl/p/ABCD12,04:AA,WRISTBAND"],
      new Set(),
      new Set(["04:AA"]),
    );
    expect(row.errors).toContain("UID NFC duplicado");
  });

  it("usa WRISTBAND si productType es desconocido", () => {
    const [row] = validateImportRows(["ABCD12,https://helplis.cl/p/ABCD12,04:AA,UNKNOWN"]);
    expect(row.productType).toBe(ProductType.WRISTBAND);
  });
});
