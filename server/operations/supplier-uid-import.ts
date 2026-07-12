import JSZip from "jszip";
import { prisma } from "@/server/db/client";

export type SupplierReturnRow = {
  rowNumber: number;
  public_code?: string;
  public_url?: string;
  nfc_uid?: string;
  qr_result?: string;
  nfc_result?: string;
  wristband_reference?: string;
  batch_reference?: string;
  notes?: string;
  raw: Record<string, string>;
};

export type SupplierReturnPreviewRow = SupplierReturnRow & {
  deviceId?: string;
  errors: string[];
  warnings: string[];
};

const aliases: Record<string, keyof Omit<SupplierReturnRow, "rowNumber" | "raw">> = {
  publiccode: "public_code",
  public_code: "public_code",
  code: "public_code",
  publicurl: "public_url",
  public_url: "public_url",
  url: "public_url",
  nfcuid: "nfc_uid",
  nfc_uid: "nfc_uid",
  uid: "nfc_uid",
  qrresult: "qr_result",
  qr_result: "qr_result",
  nfcresult: "nfc_result",
  nfc_result: "nfc_result",
  wristbandreference: "wristband_reference",
  wristband_reference: "wristband_reference",
  batchreference: "batch_reference",
  batch_reference: "batch_reference",
  notes: "notes",
  note: "notes",
};

function normalizeHeader(header: string) {
  return header.trim().toLowerCase().replace(/[\s.-]+/g, "_").replace(/[^a-z0-9_]/g, "");
}

function normalizeUid(value: string | undefined) {
  return value?.trim().toUpperCase().replace(/\s+/g, "") || "";
}

function decodeXml(value: string) {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function cellIndex(cellRef: string) {
  const letters = cellRef.replace(/[0-9]/g, "");
  return letters.split("").reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

async function parseXlsx(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const sharedRaw = await zip.file("xl/sharedStrings.xml")?.async("string");
  const sharedStrings = sharedRaw
    ? [...sharedRaw.matchAll(/<si[^>]*>([\s\S]*?)<\/si>/g)].map((match) =>
        decodeXml([...match[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((part) => part[1]).join("")),
      )
    : [];
  const sheet = await zip.file("xl/worksheets/sheet1.xml")?.async("string");
  if (!sheet) throw new Error("No se encontro la primera hoja XLSX.");

  return [...sheet.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map((rowMatch) => {
    const values: string[] = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attributes = cellMatch[1];
      const ref = attributes.match(/r="([^"]+)"/)?.[1] ?? "";
      const index = ref ? cellIndex(ref) : values.length;
      const type = attributes.match(/t="([^"]+)"/)?.[1];
      const body = cellMatch[2];
      let value = "";
      if (type === "s") {
        const sharedIndex = Number(body.match(/<v[^>]*>([\s\S]*?)<\/v>/)?.[1] ?? -1);
        value = sharedStrings[sharedIndex] ?? "";
      } else {
        value = body.match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1] ?? body.match(/<v[^>]*>([\s\S]*?)<\/v>/)?.[1] ?? "";
        value = decodeXml(value);
      }
      values[index] = value.trim();
    }
    return values;
  });
}

function mapRows(table: string[][]): SupplierReturnRow[] {
  const [headerRow, ...dataRows] = table;
  if (!headerRow) return [];
  const mappedHeaders = headerRow.map((header) => aliases[normalizeHeader(header)] ?? undefined);
  return dataRows.map((row, index) => {
    const raw: Record<string, string> = {};
    const mapped: Partial<SupplierReturnRow> = { rowNumber: index + 2, raw };
    row.forEach((value, columnIndex) => {
      const originalHeader = headerRow[columnIndex] || `column_${columnIndex + 1}`;
      raw[originalHeader] = value;
      const mappedHeader = mappedHeaders[columnIndex];
      if (mappedHeader && value) mapped[mappedHeader] = value.trim();
    });
    return mapped as SupplierReturnRow;
  });
}

export async function parseSupplierReturn(filename: string, buffer: Buffer) {
  if (/\.xlsx$/i.test(filename)) return mapRows(await parseXlsx(buffer));
  return mapRows(parseCsv(buffer.toString("utf8")));
}

export async function validateSupplierReturn(batchId: string, rows: SupplierReturnRow[]) {
  const batch = await prisma.batch.findUnique({ where: { id: batchId } });
  if (!batch) throw new Error("Batch not found.");

  const seenCodes = new Set<string>();
  const seenUids = new Set<string>();
  const preview: SupplierReturnPreviewRow[] = [];

  for (const row of rows) {
    const errors: string[] = [];
    const warnings: string[] = [];
    const publicCode = row.public_code?.trim().toUpperCase();
    const publicUrl = row.public_url?.trim();
    const uid = normalizeUid(row.nfc_uid);
    const batchReference = row.batch_reference?.trim();
    let device = null;

    if (batchReference && batchReference !== batch.internalReference) errors.push("batch_reference no coincide con el lote");
    if (publicCode && seenCodes.has(publicCode)) errors.push("public_code duplicado en archivo");
    if (uid && seenUids.has(uid)) errors.push("nfc_uid duplicado en archivo");
    if (publicCode) seenCodes.add(publicCode);
    if (uid) seenUids.add(uid);
    if (uid && !/^[A-F0-9:-]{4,40}$/.test(uid)) errors.push("nfc_uid invalido");

    if (publicCode) {
      device = await prisma.device.findFirst({ where: { batchId, publicCode } });
    } else if (publicUrl) {
      device = await prisma.device.findFirst({ where: { batchId, publicUrl } });
    } else if (row.wristband_reference) {
      const sequence = Number(row.wristband_reference.split("-").at(-1));
      if (Number.isInteger(sequence)) {
        device = await prisma.device.findFirst({ where: { batchId, internalSequence: sequence } });
      }
    }

    if (!device) errors.push("public_code/public_url/referencia no encontrada en este lote");
    if (device && publicUrl && publicUrl !== device.publicUrl) errors.push("public_url no coincide con la URL esperada");
    if (device && publicCode && publicCode !== device.publicCode) errors.push("public_code no coincide con el dispositivo");
    if (device && uid) {
      const uidOwner = await prisma.device.findFirst({ where: { nfcUid: uid, NOT: { id: device.id } } });
      if (uidOwner) errors.push("nfc_uid ya existe en otra pulsera");
      if (device.nfcUid && device.nfcUid !== uid) errors.push("nfc_uid intenta cambiar un UID ya importado");
    }

    if (!uid) warnings.push("nfc_uid vacio");
    if (row.qr_result && !/^(ok|pass|passed|true|si|sí)$/i.test(row.qr_result.trim())) warnings.push("qr_result no indica OK");
    if (row.nfc_result && !/^(ok|pass|passed|true|si|sí)$/i.test(row.nfc_result.trim())) warnings.push("nfc_result no indica OK");

    preview.push({
      ...row,
      public_code: publicCode,
      public_url: publicUrl,
      nfc_uid: uid,
      deviceId: device?.id,
      errors,
      warnings,
    });
  }

  return preview;
}

export async function importSupplierUidReturn(input: {
  batchId: string;
  filename: string;
  buffer: Buffer;
  dryRun?: boolean;
  createdBy?: string;
}) {
  const rows = await parseSupplierReturn(input.filename, input.buffer);
  const preview = await validateSupplierReturn(input.batchId, rows);
  const invalidRows = preview.filter((row) => row.errors.length > 0).length;
  const duplicateRows = preview.filter((row) => row.errors.some((error) => error.includes("duplicado"))).length;
  const validRows = preview.length - invalidRows;
  const importedRows = input.dryRun ? 0 : validRows;

  const importJob = await prisma.supplierUidImport.create({
    data: {
      batchId: input.batchId,
      filename: input.filename,
      status: input.dryRun ? "PREVIEWED" : invalidRows ? "PARTIALLY_IMPORTED" : "IMPORTED",
      totalRows: preview.length,
      validRows,
      invalidRows,
      duplicateRows,
      importedRows,
      preview: JSON.stringify(preview.slice(0, 100)),
      createdBy: input.createdBy,
      completedAt: input.dryRun ? null : new Date(),
    },
  });

  if (!input.dryRun) {
    for (const row of preview) {
      if (row.errors.length || !row.deviceId || !row.nfc_uid) continue;
      await prisma.device.update({
        where: { id: row.deviceId },
        data: {
          nfcUid: row.nfc_uid,
          productionStatus: "RECEIVED",
          inventoryStatus: "RECEIVED",
        },
      });
    }

    const receivedQuantity = await prisma.device.count({
      where: { batchId: input.batchId, nfcUid: { not: null } },
    });
    const batch = await prisma.batch.findUnique({ where: { id: input.batchId } });
    await prisma.batch.update({
      where: { id: input.batchId },
      data: {
        receivedQuantity,
        receivedAt: new Date(),
        status: batch && receivedQuantity >= batch.quantity ? "RECEIVED" : "PARTIALLY_RECEIVED",
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorUserId: input.createdBy,
      action: input.dryRun ? "SUPPLIER_UID_IMPORT_PREVIEWED" : "SUPPLIER_UID_IMPORT_IMPORTED",
      entityType: "SupplierUidImport",
      entityId: importJob.id,
      newData: JSON.stringify({
        batchId: input.batchId,
        filename: input.filename,
        totalRows: preview.length,
        validRows,
        invalidRows,
        duplicateRows,
        dryRun: Boolean(input.dryRun),
      }),
    },
  });

  return importJob;
}
