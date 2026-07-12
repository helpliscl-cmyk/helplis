# HelPlis operations security audit

Date: 2026-07-12

## Scope

Reviewed the new operational surfaces for production batches, supplier exports, UID import, physical verification, inventory, orders, manual payments, manual shipping, packing, activation cards, institutions and support.

## Implemented hardening

- Admin routes stay behind `requireRole(["ADMIN", "SUPER_ADMIN", "SUPPORT"])` through the admin layout or API route checks.
- Supplier export files never include `activationCode`; CSV/XLSX cells are neutralized against spreadsheet formula injection.
- Production file downloads resolve paths under `data/production` and reject traversal outside that root.
- Manufacturer export format is runtime-whitelisted.
- UID imports validate batch reference, public code, URL, duplicate UID, malformed UID and idempotent re-imports.
- Packing reveals `activationCode` only from admin pages and records `ACTIVATION_CODE_REVEALED_FOR_PACKING`.
- Public support and institution forms now have process-local rate limiting keyed by contact data.
- `activationCode` is stored as bcrypt hash plus encrypted envelope for authorized packing only.

## Remaining risks

- Production runtime is still SQLite/demo-oriented until Supabase is switched on for operational data.
- Process-local rate limiting resets on serverless instance recycle; use Upstash, Supabase or provider-level rate limiting before heavy traffic.
- `npm audit` reports a moderate advisory in Next's bundled PostCSS. The suggested npm fix is a major downgrade, so it is not applied here.
- File upload/photo evidence is URL/reference-only for now; real uploads need size/type scanning and storage policies.
- Manual payment and shipping providers rely on admin trust and audit logs; no bank/payment-webhook verification exists yet.
- Reservation is transactional but should be re-tested under the final production database isolation mode.

## Supabase/RLS notes

Existing migrations enable RLS on core public/user tables. The new operational tables need equivalent Supabase policies before flipping production writes to Supabase. Recommended policy shape:

- admins/support can manage batches, production files, UID imports, verification, inventory, orders, payments, shipments and tickets;
- public users cannot read UID, inventory, production files or activation envelopes;
- customers can read only their own future orders after account linking;
- audit logs are admin/support read-only and append-only from server code.

## Decisions still needed

- External rate-limit provider.
- Real file storage bucket for production artifacts and evidence photos.
- Final payment provider for Chile.
- Final shipping/carrier integration.
- Operational role split between support, packing and super admin.
