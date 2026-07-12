import { describe, expect, it } from "vitest";
import { parseSupplierReturn } from "@/server/operations/supplier-uid-import";
import { rowsToWorkbookBuffer, type ProductionExportRow } from "@/server/operations/manufacturer-export";

describe("supplier UID import parsing", () => {
  it("maps CSV aliases into normalized supplier rows", async () => {
    const rows = await parseSupplierReturn(
      "return.csv",
      Buffer.from("publicCode,URL,UID,qr_result,nfc_result\nABC234,https://helplis.cl/p/ABC234,04AABB,OK,OK"),
    );
    expect(rows[0].public_code).toBe("ABC234");
    expect(rows[0].public_url).toBe("https://helplis.cl/p/ABC234");
    expect(rows[0].nfc_uid).toBe("04AABB");
  });

  it("reads HelPlis-generated XLSX production data", async () => {
    const productionRow: ProductionExportRow = {
      wristband_reference: "SAMPLE-DEMO-001-0001",
      public_code: "ABC234",
      public_url: "https://helplis.cl/p/ABC234",
      qr_content: "https://helplis.cl/p/ABC234",
      nfc_content: "https://helplis.cl/p/ABC234",
      qr_filename: "SAMPLE-DEMO-001-0001.png",
      batch_reference: "SAMPLE-DEMO-001",
      product_type: "WRISTBAND",
    };
    const workbook = await rowsToWorkbookBuffer([productionRow]);
    const rows = await parseSupplierReturn("production.xlsx", workbook);
    expect(rows[0].public_code).toBe("ABC234");
    expect(rows[0].public_url).toBe("https://helplis.cl/p/ABC234");
  });
});
