# Supabase Schema

Fecha: 2026-07-13

Migraciones agregadas:

- `20260713093000_public_profile_update.sql`
- `20260713094000_operations_tables.sql`
- `20260713095000_rls_policies.sql`
- `20260713095500_secure_public_endpoints.sql`
- `20260713100000_profile_photo_storage.sql`
- `20260713113000_people_first_activation.sql`

## People-first activation

Campos nuevos o confirmados:

- `profiles.critical_information`
- `profiles.show_display_name`
- `profiles.show_critical_information`
- `contacts.type`
- `contacts.relationship_code`

`contacts.type` acepta `PRIMARY` y `SECONDARY`.

`contacts.relationship_code` acepta `MOTHER`, `FATHER`, `FAMILY`, `RESPONSIBLE`.

## Storage

El bucket `profile-photos` sigue privado. La primera implementacion local guarda `photoUrl`; el corte Supabase debe usar storage protegido por owner.
