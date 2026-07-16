import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import { sha256 } from "@/server/operations/manufacturer-export";
import {
  HELPETS_INTERNAL_EXPORT_NAME,
  HELPETS_SAMPLE_BATCH_REFERENCE,
  HELPETS_SIMPLE_EXPORT_NAME,
} from "@/server/operations/helpets-sample";

const personasCodes = new Set(["SJRUPNZQ", "BCM3BLAJ", "H26EJYQW", "THAHHRYR", "TCR6MTJB"]);
const exportsRoot = path.join(process.cwd(), "exports");
const simpleDir = path.join(exportsRoot, HELPETS_SIMPLE_EXPORT_NAME);
const internalDir = path.join(exportsRoot, HELPETS_INTERNAL_EXPORT_NAME);
const simpleZipPath = path.join(exportsRoot, `${HELPETS_SIMPLE_EXPORT_NAME}.zip`);
const internalZipPath = path.join(exportsRoot, `${HELPETS_INTERNAL_EXPORT_NAME}.zip`);

const expectedSimpleFiles = [
  "01-helpets-5-urls.xlsx",
  "02-helpets-5-urls.csv",
  "03-helpets-front-logo-color.pdf",
  "04-helpets-front-logo-black.pdf",
  "05-helpets-front-logo-color.svg",
  "06-helpets-front-logo-black.svg",
  "07-helpets-back-layout.pdf",
  "08-helpets-back-layout.svg",
  "09-message-to-leanne.txt",
];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function collectFiles(root: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(path.join(root, prefix), { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(root, relative)));
    } else {
      files.push(relative);
    }
  }
  return files.sort();
}

function parseCsv(csv: string) {
  return csv
    .trim()
    .split(/\r?\n/)
    .map((line) => {
      const cells: string[] = [];
      let current = "";
      let quoted = false;
      for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        if (char === '"' && quoted && line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else if (char === '"') {
          quoted = !quoted;
        } else if (char === "," && !quoted) {
          cells.push(current);
          current = "";
        } else {
          current += char;
        }
      }
      cells.push(current);
      return cells;
    });
}

async function validateZipExact(zipPath: string, expectedFiles: string[]) {
  const zip = await JSZip.loadAsync(await readFile(zipPath));
  const files = Object.values(zip.files)
    .filter((entry) => !entry.dir)
    .map((entry) => entry.name)
    .sort();
  assert(JSON.stringify(files) === JSON.stringify([...expectedFiles].sort()), `${zipPath} has unexpected files.`);
  return zip;
}

async function validateNoSensitiveStrings(root: string) {
  const files = await collectFiles(root);
  for (const file of files) {
    const data = await readFile(path.join(root, file));
    const text = data.toString("utf8");
    assert(!/activationCode|activationCodeHash|ownerId|profileId|service_role|DATABASE_URL|DIRECT_URL/i.test(text), `${file} exposes sensitive data.`);
  }
}

async function validateSimplePackage() {
  assert((await stat(simpleDir)).isDirectory(), "Simple package directory is missing.");
  assert((await stat(simpleZipPath)).isFile(), "Simple package zip is missing.");
  const simpleFiles = await collectFiles(simpleDir);
  assert(JSON.stringify(simpleFiles) === JSON.stringify(expectedSimpleFiles), "Simple package file list is not exact.");
  await validateZipExact(simpleZipPath, expectedSimpleFiles);
  await validateNoSensitiveStrings(simpleDir);

  const csvRows = parseCsv(await readFile(path.join(simpleDir, "02-helpets-5-urls.csv"), "utf8"));
  assert(csvRows.length === 6, "CSV must contain one header and five rows.");
  assert(csvRows[0].join("|") === "Tag Reference|Public Code|Public URL|QR URL|NFC URL|Batch Reference", "CSV header mismatch.");

  for (const [index, row] of csvRows.slice(1).entries()) {
    const [tagReference, publicCode, publicUrl, qrUrl, nfcUrl, batchReference] = row;
    assert(tagReference === `P-${String(index + 1).padStart(3, "0")}`, "Tag reference mismatch.");
    assert(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/.test(publicCode), `Ambiguous or invalid publicCode: ${publicCode}`);
    assert(!personasCodes.has(publicCode), `Personas publicCode reused: ${publicCode}`);
    assert(publicUrl === `https://helplis.cl/p/${publicCode}`, "Public URL mismatch.");
    assert(publicUrl === qrUrl && publicUrl === nfcUrl, "Public URL, QR URL and NFC URL must match.");
    assert(batchReference === HELPETS_SAMPLE_BATCH_REFERENCE, "Batch reference mismatch.");
  }

  const workbookZip = await JSZip.loadAsync(await readFile(path.join(simpleDir, "01-helpets-5-urls.xlsx")));
  const productionSheet = await workbookZip.file("xl/worksheets/sheet1.xml")?.async("string");
  assert(productionSheet?.match(/<row /g)?.length === 6, "Workbook Production Data sheet must contain 5 rows plus header.");

  const blackLogoSvg = await readFile(path.join(simpleDir, "06-helpets-front-logo-black.svg"), "utf8");
  assert(!blackLogoSvg.includes("linearGradient"), "Black logo SVG must not include gradients.");
  assert(!blackLogoSvg.includes("url(#"), "Black logo SVG must not use gradient fills.");

  const backLayoutSvg = await readFile(path.join(simpleDir, "08-helpets-back-layout.svg"), "utf8");
  assert(backLayoutSvg.includes("Escanea") || backLayoutSvg.includes("<path"), "Back layout must include vector text/art.");
  assert(backLayoutSvg.includes("VARIABLE QR - REPLACE PER TAG"), "Back layout must include variable QR placeholder.");
  assert(!/helpets-vertical|HelPets vertical/i.test(backLayoutSvg), "Back layout must not place Helpets logo under QR.");
}

async function validateInternalPackage() {
  assert((await stat(internalDir)).isDirectory(), "Internal package directory is missing.");
  assert((await stat(internalZipPath)).isFile(), "Internal package zip is missing.");
  await validateNoSensitiveStrings(internalDir);

  const zip = await JSZip.loadAsync(await readFile(internalZipPath));
  const files = Object.values(zip.files)
    .filter((entry) => !entry.dir)
    .map((entry) => entry.name)
    .sort();

  const qrPngFiles = files.filter((file) => file.startsWith("qr-png/") && file.endsWith(".png"));
  const qrSvgFiles = files.filter((file) => file.startsWith("qr-svg/") && file.endsWith(".svg"));
  assert(qrPngFiles.length === 5, "Internal package must include five QR PNG files.");
  assert(qrSvgFiles.length === 5, "Internal package must include five QR SVG files.");
  assert(files.includes("checksums-sha256.txt"), "Internal package must include checksums.");
  assert(files.includes("validations/manifest.json"), "Internal package must include manifest.");
  assert(files.includes("supplier-return/supplier-return-template.csv"), "Internal package must include supplier return template.");

  const csvRows = parseCsv(await readFile(path.join(internalDir, "production-data", "02-helpets-5-urls.csv"), "utf8"));
  const urlByPublicCode = new Map(csvRows.slice(1).map((row) => [row[1], row[2]]));

  for (const qrFile of qrPngFiles) {
    const publicCode = qrFile.match(/-([ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8})\.png$/)?.[1];
    assert(publicCode, `Could not derive publicCode from ${qrFile}.`);
    const buffer = await zip.file(qrFile)?.async("nodebuffer");
    assert(buffer, `Missing ${qrFile}.`);
    const png = PNG.sync.read(buffer);
    const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
    assert(decoded?.data === urlByPublicCode.get(publicCode), `${qrFile} does not decode to its exact URL.`);
  }

  const checksums = (await zip.file("checksums-sha256.txt")?.async("string")) ?? "";
  for (const line of checksums.trim().split("\n")) {
    const [hash, filename] = line.split(/\s{2,}/);
    const file = zip.file(filename);
    assert(file, `Checksum references missing file ${filename}.`);
    const data = await file!.async("nodebuffer");
    assert(hash === sha256(data), `Checksum mismatch for ${filename}.`);
  }
}

async function main() {
  await validateSimplePackage();
  await validateInternalPackage();
  console.log(
    JSON.stringify(
      {
        ok: true,
        simplePackage: simpleDir,
        simpleZip: simpleZipPath,
        internalPackage: internalDir,
        internalZip: internalZipPath,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
