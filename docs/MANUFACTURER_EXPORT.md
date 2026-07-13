# Manufacturer export

Implemented at `/admin/production/[batchId]/export` and `npm run production:export -- BATCH_REFERENCE FULL_PACKAGE`.

Formats:

- URLs only CSV
- production CSV
- XLSX with `Production Data` and `Instructions`
- QR PNG ZIP
- QR SVG ZIP
- full package ZIP

The standard package includes public URL, QR content and NFC content. It never includes `activationCode`.

Full package files:

- `production-data.csv`
- `production-data.xlsx`
- `instructions-en.txt`
- `batch-summary.json`
- `checksums.txt`
- `qr-png/`
- `qr-svg/`

CSV/XLSX values are neutralized against spreadsheet formula injection.

## SAMPLE preview

Antes de confirmar `SAMPLE-HELPLIS-001`, `/admin/production/sample-preview` puede generar en memoria:

- Excel `manufacturer.xlsx`.
- QR PNG ZIP.
- QR SVG ZIP.
- Plantilla CSV de retorno.

Columnas minimas para Emilia:

- `Wristband Reference`
- `Public Code`
- `Public URL`
- `QR Content`
- `NFC Content`
- `QR Filename`
- `Batch Reference`

Instrucciones en ingles:

- five unique wristbands;
- each QR must use the corresponding unique URL;
- each NTAG213 must contain that same URL;
- one-to-one matching;
- return UID;
- continuous QR/NFC test;
- do not alter URLs.

Nunca incluir:

- activationCode;
- activationCodeHash;
- ownerId;
- UID inventado;
- datos personales;
- contactos.
