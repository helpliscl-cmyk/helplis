# Backup and recovery

Operational data to protect:

- Supabase DB
- Storage
- users
- profiles
- contacts
- batches
- production files
- UID imports
- activation hashes/envelopes
- orders
- payments
- shipments
- audit logs
- tickets

Recommended cadence:

- daily database backups
- weekly restore drill
- export production packages after every generated batch
- retain audit logs append-only

Recovery runbook:

1. Stop writes if corruption is suspected.
2. Snapshot current state.
3. Restore latest verified DB backup.
4. Restore storage bucket artifacts.
5. Reconcile production files by checksum.
6. Verify sample public profiles and admin dashboards.
