# Production workflow

HelPlis creates every wristband digitally before supplier production.

Flow:

1. Create a DEMO/SAMPLE/MASS_PRODUCTION batch in `/admin/production/new`.
2. Generate production codes in the batch detail.
3. Export the supplier package from `/admin/production/[batchId]/export`.
4. Send files manually only after operational approval.
5. Import supplier UID return in `/admin/production/[batchId]/supplier-return`.
6. Verify each physical unit in `/admin/production/[batchId]/verification`.
7. Verified units become available inventory.

The real 500-unit batch is not generated automatically.
