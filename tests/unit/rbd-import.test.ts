import { describe, expect, it } from "vitest";
import { parseRbdImportCsv, previewRbdImport } from "@/server/mime/importer";

describe("importación RBD", () => {
  it("valida columnas y clasifica filas nuevas y actualizadas", () => {
    const parsed = parseRbdImportCsv(
      [
        "RBD,Nombre,Región,Comuna,Dependencia,Estado",
        "8927,Liceo Demo,Región Metropolitana,Providencia,Particular subvencionado,Funcionando",
        "5611,Escuela Demo,Región Metropolitana,Santiago,Municipal,Funcionando",
      ].join("\n"),
    );
    const preview = previewRbdImport(parsed.rows, new Set([8927]), parsed.columnErrors);
    expect(preview.columnErrors).toEqual([]);
    expect(preview.updatedRows).toBe(1);
    expect(preview.newRows).toBe(1);
  });

  it("detecta RBD duplicado dentro del archivo", () => {
    const parsed = parseRbdImportCsv(["RBD,Nombre", "8927,Liceo Demo", "8927,Liceo Duplicado"].join("\n"));
    const preview = previewRbdImport(parsed.rows);
    expect(preview.errorRows).toBe(1);
    expect(preview.rows[1].errors).toContain("RBD duplicado en archivo.");
  });

  it("marca error cuando falta la columna RBD", () => {
    const parsed = parseRbdImportCsv(["Nombre,Comuna", "Liceo Demo,Providencia"].join("\n"));
    const preview = previewRbdImport(parsed.rows, new Set(), parsed.columnErrors);
    expect(preview.columnErrors).toContain("Falta columna RBD.");
    expect(preview.errorRows).toBeGreaterThan(0);
  });
});
