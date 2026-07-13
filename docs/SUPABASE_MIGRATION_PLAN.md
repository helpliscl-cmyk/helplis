# Supabase Migration Plan

Fecha: 2026-07-13

## Orden

1. Confirmar proyecto Supabase correcto.
2. Aplicar `20260711180000_helplis_mvp.sql` si el proyecto esta vacio.
3. Aplicar `20260712010000_purchase_intent_pricing.sql`.
4. Aplicar `20260713093000_public_profile_update.sql`.
5. Aplicar `20260713094000_operations_tables.sql`.
6. Aplicar `20260713095000_rls_policies.sql`.
7. Aplicar `20260713095500_secure_public_endpoints.sql`.
8. Aplicar `20260713100000_profile_photo_storage.sql`.

## Validacion

- Verificar tablas con `information_schema`.
- Verificar RLS habilitado.
- Verificar RPC: `resolve_public_profile`, `register_scan`, `share_location`, `report_found`, `contact_action`, `activate_device`.
- Verificar bucket `profile-photos`.
- Probar anon, authenticated user, support, operations y admin.

## Produccion

No ejecutar SQL manual no versionado. Si una aplicacion remota falla, crear una nueva migracion correctiva.
