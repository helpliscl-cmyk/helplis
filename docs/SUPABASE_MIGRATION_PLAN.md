# Supabase Migration Plan

Fecha: 2026-07-13

## Proyecto remoto verificado

- Supabase project ref observado en dashboard: `ndzcpzjkseugqffyeslr`
- Proyecto visible: `helpliscl-cmyk's Project`
- Branch Supabase: `main`, production

## Migraciones versionadas

Orden esperado:

1. `20260711180000_helplis_mvp.sql`
2. `20260712010000_purchase_intent_pricing.sql`
3. `20260713093000_public_profile_update.sql`
4. `20260713094000_operations_tables.sql`
5. `20260713095000_rls_policies.sql`
6. `20260713095500_secure_public_endpoints.sql`
7. `20260713100000_profile_photo_storage.sql`

## Estado aplicado

Las migraciones nuevas de perfil publico, operaciones, RLS, endpoints seguros y storage fueron aplicadas manualmente desde Supabase SQL Editor.

Nota operativa:

- Primero se ejecuto `alter type public.app_role add value if not exists 'OPERATIONS';`
- Luego se ejecuto el SQL combinado de migraciones.
- Motivo: Postgres no permite agregar y usar un valor nuevo de enum en la misma transaccion.

## Validacion ejecutada

La verificacion SQL devolvio `true` para:

- `location_shares`
- `found_reports`
- `production_batches`
- `orders`
- `resolve_public_profile`
- `report_found`
- `activate_device`
- RLS de `profiles`
- policy de storage
- bucket privado `profile-photos`

## Cobertura incluida en main

Despues de la regularizacion Git, `main` contiene:

- Migraciones Supabase nuevas.
- RLS y policies.
- Storage privado para fotos.
- RPCs publicas seguras.
- Endpoints publicos de scan, ubicacion, reporte encontrado y contacto.
- Tests de privacidad de ficha publica.

## Validacion de aplicacion

Ejecutada en `main` el 2026-07-13:

- `npm install`: OK.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run test`: OK.
- `npm run test:e2e`: OK.
- `npm run build`: OK.

## Pendientes

- Migrar desde SQLite demo a Supabase runtime real en la aplicacion.
- Sustituir rate limit en memoria por proveedor persistente.
- Revisar policies con usuarios reales `anon`, `authenticated`, `support`, `operations` y `admin`.
- Definir procedimiento de rollback SQL versionado.
