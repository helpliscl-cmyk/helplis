# Supplier SAMPLE package

Final local package for Emilia:

- Folder: `exports/SUPPLIER-SAMPLE-001`
- ZIP: `exports/SUPPLIER-SAMPLE-001.zip`
- Source of truth: persisted PostgreSQL batch `SAMPLE-HELPLIS-001`
- Public codes: `SJRUPNZQ`, `BCM3BLAJ`, `H26EJYQW`, `THAHHRYR`, `TCR6MTJB`

This package is generated from the five confirmed devices only. It does not use preview candidates, does not confirm a batch, does not regenerate public codes and does not create devices.

## Included

- `00-README-FIRST.txt`
- `01-production-data.xlsx`
- `02-production-data.csv`
- `03-manufacturing-instructions-en.pdf`
- `04-manufacturing-instructions-en.txt`
- `05-supplier-return-template.xlsx`
- `06-checksums-sha256.txt`
- `branding/helplis-logo-vector.pdf`
- `branding/helplis-logo-vector.svg`
- `branding/layout-reference.png`
- `branding/README-branding.txt`
- `qr-png/*.png`
- `qr-svg/*.svg`

## Excluded

The package must not contain activation codes, activation hashes, database URLs, service-role keys, cookies, owner/profile/user IDs, profile photos, fake UIDs, local databases, `.env`, Git files, `node_modules`, logs, MIME files, CRM data, school data or internal documentation.

## Validation

Run:

```bash
npm run validate:supplier-sample
```

The validator checks file structure, five exact rows, public URLs, `publicUrl = qrContent = nfcContent`, QR PNG/SVG decoding, XLSX/CSV content, supplier return blank UID cells, checksums, ZIP extraction and forbidden text tokens.

## Admin

For the confirmed batch detail page `/admin/production/[batchId]`, authorized admin roles can press `Preparar paquete final para proveedor`.

The action:

- uses only persisted devices from `SAMPLE-HELPLIS-001`;
- creates the final package;
- records a `ProductionFile`;
- records an audit log;
- exposes a final ZIP download;
- never sends files to the supplier.

## Manual Review

Before sending to Emilia:

1. Open `01-production-data.xlsx` and confirm the five rows.
2. Open `02-production-data.csv` and confirm the same five rows.
3. Open `03-manufacturing-instructions-en.pdf`.
4. Open `branding/layout-reference.png`.
5. Scan each QR PNG or SVG and confirm it opens the expected `https://helplis.cl/p/[publicCode]` URL.
6. Confirm `05-supplier-return-template.xlsx` has empty `NFC UID`, test-result, condition and notes cells.

## Send Manually

Send the ZIP manually. Ask Emilia to return:

- completed UID matching file;
- digital mockup before production;
- clear group photos of the five samples;
- one continuous video testing QR and NFC for all five samples;
- any failure notes before shipment.
