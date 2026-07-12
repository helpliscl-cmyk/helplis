# Physical verification

Implemented at `/admin/production/[batchId]/verification`.

The operator enters or scans:

- public code
- QR observed URL
- NFC observed URL
- NFC UID observed
- damage/missing flags
- optional evidence reference

The system compares QR, NFC and UID against expected values. Fully verified units become `inventoryStatus=AVAILABLE`; damaged and missing units are kept out of sellable stock.

CSV reports for supplier claims are available at `/api/admin/production/[batchId]/verification-report`.
