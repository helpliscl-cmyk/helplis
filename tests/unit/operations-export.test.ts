import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import {
  escapeCsvCell,
  manufacturerInstructionsEn,
  rowsToCsv,
  rowsToSupplierReturnTemplateCsv,
  rowsToWorkbookBuffer,
  type ProductionExportRow,
} from "@/server/operations/manufacturer-export";

const row: ProductionExportRow = {
  wristband_reference: "SAMPLE-DEMO-001-0001",
  public_code: "ABC234",
  public_url: "https://helplis.cl/p/ABC234",
  qr_content: "https://helplis.cl/p/ABC234",
  nfc_content: "https://helplis.cl/p/ABC234",
  qr_filename: "SAMPLE-DEMO-001-0001.png",
  batch_reference: "SAMPLE-DEMO-001",
  product_type: "WRISTBAND",
};

describe("manufacturer export package", () => {
  it("neutralizes spreadsheet formulas in CSV cells", () => {
    expect(escapeCsvCell("=cmd")).toBe("\"'=cmd\"");
    expect(escapeCsvCell("+1")).toBe("\"'+1\"");
  });

  it("exports supplier CSV without activation codes", () => {
    const csv = rowsToCsv([row]);
    expect(csv).toContain("public_code");
    expect(csv).toContain("ABC234");
    expect(csv).not.toContain("activation");
  });

  it("exports supplier return template with empty UID cells", () => {
    const csv = rowsToSupplierReturnTemplateCsv([row]);
    expect(csv).toContain("NFC UID");
    expect(csv.trim().split("\n")).toHaveLength(2);
    expect(csv.split("\n")[1]).toContain(',"","","","');
  });

  it("keeps supplier instructions explicit about UID and URLs", () => {
    const instructions = manufacturerInstructionsEn();
    expect(instructions).toContain("same public URL");
    expect(instructions).toContain("NFC UID");
    expect(instructions).toContain("contains no private owner data");
    expect(instructions).not.toContain("activationCode");
  });

  it("creates a minimal XLSX workbook with two sheets", async () => {
    const workbook = await rowsToWorkbookBuffer([row]);
    const zip = await JSZip.loadAsync(workbook);
    expect(zip.file("xl/worksheets/sheet1.xml")).toBeTruthy();
    expect(zip.file("xl/worksheets/sheet2.xml")).toBeTruthy();
  });
});
