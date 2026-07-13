# Supabase Schema

Fecha: 2026-07-13

Migraciones agregadas:

- `20260713093000_public_profile_update.sql`: perfiles publicos, contactos, scan events, contact actions, location shares, found reports y RPC publicas.
- `20260713094000_operations_tables.sql`: produccion, inventario, pedidos, pagos, envios, tickets, leads institucionales y activaciones.
- `20260713095000_rls_policies.sql`: RLS por owner, support, operations y admin.
- `20260713095500_secure_public_endpoints.sql`: helpers de rate limit y `activate_device`.
- `20260713100000_profile_photo_storage.sql`: bucket privado `profile-photos`.

Tablas clave:

- Publicas/controladas: `profiles`, `contacts`, `devices`, `scan_events`, `contact_actions`, `location_shares`, `found_reports`.
- Operaciones: `production_batches`, `production_files`, `supplier_uid_imports`, `physical_verifications`, `inventory_locations`.
- Comercial/soporte: `orders`, `order_items`, `payments`, `shipments`, `support_tickets`, `institution_leads`.
- Auditoria: `audit_logs`, `notification_events`, `public_rate_limits`.
