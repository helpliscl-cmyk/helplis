# Supplier return import

Implemented at `/admin/production/[batchId]/supplier-return` and `npm run production:import-uid -- BATCH_REFERENCE file.csv [import]`.

Accepted inputs:

- CSV
- XLSX first worksheet
- pasted CSV

Recognized columns:

- `public_code`
- `public_url`
- `nfc_uid`
- `qr_result`
- `nfc_result`
- `wristband_reference`
- `batch_reference`
- `notes`

Validation covers duplicate rows, malformed UID, unknown public code, wrong batch, wrong URL, duplicate UID in another device and idempotent re-imports.
