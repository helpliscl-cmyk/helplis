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
