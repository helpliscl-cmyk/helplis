import { ProductType } from "@prisma/client";
import { buildPublicUrl, isAllowedPublicUrl } from "@/server/services/codes";

export type ImportValidationResult = {
  rowNumber: number;
  publicCode: string;
  publicUrl: string;
  nfcUid: string;
  productType: ProductType;
  isValid: boolean;
  errors: string[];
};

export function validateImportRows(
  rows: string[],
  existingCodes = new Set<string>(),
  existingUids = new Set<string>(),
): ImportValidationResult[] {
  const seenCodes = new Set<string>();
  const seenUids = new Set<string>();

  return rows.map((row, index) => {
    const [publicCodeRaw = "", publicUrl = "", nfcUidRaw = "", productTypeRaw = "WRISTBAND"] = row
      .split(",")
      .map((value) => value.trim());
    const publicCode = publicCodeRaw.toUpperCase();
    const nfcUid = nfcUidRaw.toUpperCase();
    const errors: string[] = [];

    if (!/^[A-Z0-9]{4,12}$/.test(publicCode)) errors.push("publicCode inválido");
    if (!isAllowedPublicUrl(publicUrl) || publicUrl !== buildPublicUrl(publicCode)) {
      errors.push("URL no coincidente");
    }
    if (seenCodes.has(publicCode) || existingCodes.has(publicCode)) errors.push("publicCode duplicado");
    if (nfcUid && (seenUids.has(nfcUid) || existingUids.has(nfcUid))) errors.push("UID NFC duplicado");

    seenCodes.add(publicCode);
    if (nfcUid) seenUids.add(nfcUid);

    return {
      rowNumber: index + 1,
      publicCode,
      publicUrl,
      nfcUid,
      productType: Object.values(ProductType).includes(productTypeRaw as ProductType)
        ? (productTypeRaw as ProductType)
        : ProductType.WRISTBAND,
      isValid: errors.length === 0,
      errors,
    };
  });
}
