import { describe, expect, it } from "vitest";
import { DeviceStatus, ProductType } from "@prisma/client";
import { hashActivationCode } from "@/lib/security/hashing";
import { prisma } from "@/server/db/client";
import { parseSupplierReturn, validateSupplierReturn } from "@/server/operations/supplier-uid-import";
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

  it("matches supplier UID rows by exact public URL", async () => {
    const suffix = `T${Date.now()}`;
    const publicCode = `S${String(Date.now()).slice(-7)}`;
    const publicUrl = `https://helplis.cl/p/${publicCode}`;
    const batch = await prisma.batch.create({
      data: {
        internalReference: `TEST-URL-UID-${suffix}`,
        supplierName: "Emilia",
        productType: ProductType.WRISTBAND,
        productionMode: "SAMPLE",
        quantity: 1,
        status: "AWAITING_QUOTE",
      },
    });

    try {
      const device = await prisma.device.create({
        data: {
          internalSequence: 1,
          publicCode,
          publicUrl,
          qrContent: publicUrl,
          nfcContent: publicUrl,
          activationCodeHash: await hashActivationCode("ABCDE-23456"),
          batchId: batch.id,
          productType: ProductType.WRISTBAND,
          status: DeviceStatus.UNASSIGNED,
          productionStatus: "CODES_GENERATED",
          inventoryStatus: "IN_PRODUCTION",
        },
      });

      const rows = await parseSupplierReturn(
        "supplier-return.csv",
        Buffer.from(`Public URL,NFC UID,QR Test Result,NFC Test Result\n${publicUrl},04AABBCC,OK,OK`),
      );
      const preview = await validateSupplierReturn(batch.id, rows);

      expect(preview[0].deviceId).toBe(device.id);
      expect(preview[0].nfc_uid).toBe("04AABBCC");
      expect(preview[0].errors).toEqual([]);
    } finally {
      await prisma.device.deleteMany({ where: { batchId: batch.id } });
      await prisma.batch.delete({ where: { id: batch.id } });
    }
  });
});
