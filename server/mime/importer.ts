import { load } from "cheerio";
import JSZip from "jszip";
import type { PrismaClient } from "@prisma/client";
import { emptyToNull, normalizeForMatch, parseRbd } from "@/server/mime/normalization";
import { buildMimeUrl } from "@/server/mime/types";
import { prisma } from "@/server/db/client";

export type RbdImportRow = {
  rowNumber: number;
  rbd: number | null;
  name: string | null;
  region: string | null;
  commune: string | null;
  dependency: string | null;
  status: string | null;
  rawData: Record<string, string>;
  errors: string[];
};

export type RbdImportPreviewRow = RbdImportRow & {
  action: "new" | "update" | "skip" | "error";
};

export type RbdImportPreview = {
  totalRows: number;
  newRows: number;
  updatedRows: number;
  skippedRows: number;
  errorRows: number;
  columnErrors: string[];
  rows: RbdImportPreviewRow[];
};

export type RbdImportCommitResult = {
  createdRows: number;
  updatedRows: number;
  skippedRows: number;
  errorRows: number;
  errors: Array<{ rowNumber: number; errors: string[] }>;
};

const HEADER_VARIANTS = {
  rbd: ["rbd"],
  name: ["nombre", "establecimiento", "nombre establecimiento", "nombre del establecimiento"],
  region: ["region", "región"],
  commune: ["comuna"],
  dependency: ["dependencia"],
  status: ["estado", "status"],
};

function parseCsvMatrix(content: string) {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let quoted = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      row.push(current.trim());
      current = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current.trim());
      if (row.some(Boolean)) rows.push(row);
      current = "";
      row = [];
      continue;
    }
    current += char;
  }

  row.push(current.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function columnIndexToLetters(index: number) {
  let result = "";
  let number = index + 1;
  while (number > 0) {
    const remainder = (number - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    number = Math.floor((number - 1) / 26);
  }
  return result;
}

function columnLettersToIndex(letters: string) {
  return letters
    .toUpperCase()
    .split("")
    .reduce((index, char) => index * 26 + char.charCodeAt(0) - 64, 0) - 1;
}

async function parseXlsxMatrix(buffer: ArrayBuffer) {
  const zip = await JSZip.loadAsync(buffer);
  const sharedStringsXml = await zip.file("xl/sharedStrings.xml")?.async("text");
  const sharedStrings: string[] = [];

  if (sharedStringsXml) {
    const $ = load(sharedStringsXml, { xmlMode: true });
    $("si").each((_, node) => {
      sharedStrings.push($(node).find("t").toArray().map((textNode) => $(textNode).text()).join(""));
    });
  }

  const sheetPath =
    Object.keys(zip.files)
      .filter((path) => /^xl\/worksheets\/sheet\d+\.xml$/.test(path))
      .sort()[0] ?? "xl/worksheets/sheet1.xml";
  const sheetXml = await zip.file(sheetPath)?.async("text");
  if (!sheetXml) return [];

  const $ = load(sheetXml, { xmlMode: true });
  const matrix: string[][] = [];
  $("row").each((_, rowNode) => {
    const rowValues: string[] = [];
    $(rowNode)
      .find("c")
      .each((_, cellNode) => {
        const cell = $(cellNode);
        const reference = cell.attr("r") ?? `${columnIndexToLetters(rowValues.length)}1`;
        const columnIndex = columnLettersToIndex(reference.replace(/\d+/g, ""));
        const type = cell.attr("t");
        const rawValue = cell.find("v").text() || cell.find("is t").text();
        const value = type === "s" ? sharedStrings[Number(rawValue)] ?? "" : rawValue;
        rowValues[columnIndex] = value.trim();
      });
    if (rowValues.some(Boolean)) matrix.push(rowValues.map((value) => value ?? ""));
  });
  return matrix;
}

function headerKey(value: string) {
  return normalizeForMatch(value);
}

function findColumn(headers: string[], variants: string[]) {
  const normalizedHeaders = headers.map(headerKey);
  return normalizedHeaders.findIndex((header) =>
    variants.some((variant) => header === headerKey(variant) || header.includes(headerKey(variant))),
  );
}

function matrixToRows(matrix: string[][]) {
  const headers = matrix[0] ?? [];
  const columnErrors: string[] = [];
  const rbdIndex = findColumn(headers, HEADER_VARIANTS.rbd);
  if (rbdIndex === -1) columnErrors.push("Falta columna RBD.");

  const indices = {
    rbd: rbdIndex,
    name: findColumn(headers, HEADER_VARIANTS.name),
    region: findColumn(headers, HEADER_VARIANTS.region),
    commune: findColumn(headers, HEADER_VARIANTS.commune),
    dependency: findColumn(headers, HEADER_VARIANTS.dependency),
    status: findColumn(headers, HEADER_VARIANTS.status),
  };

  const rows = matrix.slice(1).map<RbdImportRow>((values, index) => {
    const rawData = headers.reduce<Record<string, string>>((accumulator, header, headerIndex) => {
      accumulator[header || `columna_${headerIndex + 1}`] = values[headerIndex] ?? "";
      return accumulator;
    }, {});
    const rbd = indices.rbd >= 0 ? parseRbd(values[indices.rbd]) : null;
    const errors: string[] = [];
    if (!rbd) errors.push("RBD inválido o ausente.");

    return {
      rowNumber: index + 2,
      rbd,
      name: indices.name >= 0 ? emptyToNull(values[indices.name]) : null,
      region: indices.region >= 0 ? emptyToNull(values[indices.region]) : null,
      commune: indices.commune >= 0 ? emptyToNull(values[indices.commune]) : null,
      dependency: indices.dependency >= 0 ? emptyToNull(values[indices.dependency]) : null,
      status: indices.status >= 0 ? emptyToNull(values[indices.status]) : null,
      rawData,
      errors,
    };
  });

  return { rows, columnErrors };
}

export function parseRbdImportCsv(content: string) {
  return matrixToRows(parseCsvMatrix(content));
}

export async function parseRbdImportXlsx(buffer: ArrayBuffer) {
  return matrixToRows(await parseXlsxMatrix(buffer));
}

export async function parseRbdImportFile(file: File, fallbackCsv = "") {
  if (file.size > 0 && /\.xlsx$/i.test(file.name)) {
    return parseRbdImportXlsx(await file.arrayBuffer());
  }
  if (file.size > 0) {
    return parseRbdImportCsv(await file.text());
  }
  return parseRbdImportCsv(fallbackCsv);
}

export function previewRbdImport(
  rows: RbdImportRow[],
  existingRbds = new Set<number>(),
  columnErrors: string[] = [],
): RbdImportPreview {
  const seen = new Set<number>();
  const previewRows = rows.map<RbdImportPreviewRow>((row) => {
    const errors = [...row.errors];
    if (row.rbd && seen.has(row.rbd)) errors.push("RBD duplicado en archivo.");
    if (row.rbd) seen.add(row.rbd);

    const action = errors.length ? "error" : existingRbds.has(row.rbd ?? 0) ? "update" : "new";
    return { ...row, errors, action };
  });

  return {
    totalRows: previewRows.length,
    newRows: previewRows.filter((row) => row.action === "new").length,
    updatedRows: previewRows.filter((row) => row.action === "update").length,
    skippedRows: previewRows.filter((row) => row.action === "skip").length,
    errorRows: previewRows.filter((row) => row.action === "error").length + columnErrors.length,
    columnErrors,
    rows: previewRows,
  };
}

export async function previewRbdImportWithDatabase(rows: RbdImportRow[], columnErrors: string[] = []) {
  const rbds = rows.flatMap((row) => (row.rbd ? [row.rbd] : []));
  const existing = await prisma.establishment.findMany({
    where: { rbd: { in: rbds } },
    select: { rbd: true },
  });
  return previewRbdImport(rows, new Set(existing.map((row) => row.rbd)), columnErrors);
}

export async function commitRbdImportRows(
  rows: RbdImportPreviewRow[],
  client: PrismaClient = prisma,
): Promise<RbdImportCommitResult> {
  let createdRows = 0;
  let updatedRows = 0;
  let skippedRows = 0;
  const errors: RbdImportCommitResult["errors"] = [];

  for (const row of rows) {
    if (row.action === "error" || !row.rbd || row.errors.length) {
      errors.push({ rowNumber: row.rowNumber, errors: row.errors.length ? row.errors : ["Fila no importable."] });
      continue;
    }

    if (row.action === "skip") {
      skippedRows += 1;
      continue;
    }

    const existing = await client.establishment.findUnique({ where: { rbd: row.rbd } });
    const data = {
      name: row.name ?? undefined,
      region: row.region ?? undefined,
      commune: row.commune ?? undefined,
      dependency: row.dependency ?? undefined,
      status: row.status ?? undefined,
      mimeUrl: buildMimeUrl(row.rbd),
      source: existing?.source ?? "RBD_IMPORT",
    };

    if (existing) {
      await client.establishment.update({
        where: { rbd: row.rbd },
        data,
      });
      updatedRows += 1;
    } else {
      await client.establishment.create({
        data: {
          rbd: row.rbd,
          name: row.name,
          region: row.region,
          commune: row.commune,
          dependency: row.dependency,
          status: row.status,
          mimeUrl: buildMimeUrl(row.rbd),
          source: "RBD_IMPORT",
        },
      });
      createdRows += 1;
    }
  }

  return {
    createdRows,
    updatedRows,
    skippedRows,
    errorRows: errors.length,
    errors,
  };
}
