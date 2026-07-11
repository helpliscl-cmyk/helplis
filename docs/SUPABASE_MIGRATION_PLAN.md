# Supabase Migration Plan

Fecha: 2026-07-11.

## Estado observado

- Chrome tiene sesión iniciada en Supabase.
- Proyecto visible: `helpliscl-cmyk's Project`.
- Project ref visible: `ndzcpzjkseugqffyeslr`.
- Organización visible: `helpliscl-cmyk's Org`.
- Estado inicial de tablas: sin tablas en `public`.
- Panel mostraba aviso de incidencia técnica de Supabase en la parte superior.
- La opción de habilitar RLS automáticamente para tablas nuevas estaba visible.

El proyecto fue confirmado visualmente como asociado a HelPlis por nombre de organización/proyecto.

## Entregable local preparado

Migración creada:

`supabase/migrations/20260711180000_helplis_mvp.sql`

Migración ejecutada en Supabase vía SQL Editor el 2026-07-11 con resultado: `Success. No rows returned`.

Incluye:

- Extensión `pgcrypto`.
- Enums de roles, dispositivos, perfiles, productos y método de escaneo.
- Tablas: `app_users`, `organizations`, `organization_memberships`, `devices`, `profiles`, `contacts`, `scan_events`, `location_reports`, `notification_events`, `support_messages`, `import_batches`, `import_rows`, `campaigns`, `audit_logs`.
- Índices principales.
- RLS habilitado en tablas públicas.
- Funciones `current_app_role`, `is_admin`, `is_org_member`.
- Políticas por usuario, organización y admin.
- Función `resolve_public_profile(public_code)` con `security definer`.
- Bucket privado `profile-photos` y políticas de Storage por carpeta de usuario.

## Verificación posterior en Supabase

- Tablas visibles en `public`: 14.
- Tablas verificadas: `app_users`, `organizations`, `organization_memberships`, `devices`, `profiles`, `contacts`, `scan_events`, `location_reports`, `notification_events`, `support_messages`, `import_batches`, `import_rows`, `campaigns`, `audit_logs`.
- Políticas RLS visibles, incluyendo `owners read devices`, `owners read profiles`, `public insert scans`, `public insert consented locations` y `admins read audit logs`.
- Funciones visibles: `current_app_role`, `is_admin`, `is_org_member`, `resolve_public_profile`.
- Enums visibles: `app_role`, `device_status`, `product_type`, `profile_type`, `scan_method`.
- Storage: bucket `profile-photos`, privado, 4 políticas, límite 5 MB, MIME permitidos `image/jpeg`, `image/png`, `image/webp`.

## Variables necesarias

Actualizadas en `.env.example` sin valores secretos:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `SUPABASE_STORAGE_PROFILE_BUCKET`

## Estrategia de integración

1. Mantener SQLite local para desarrollo y tests mientras la migración se valida.
2. Aplicar migración SQL al proyecto Supabase confirmado.
3. Crear cliente Supabase server-side para rutas privadas y endpoints controlados.
4. Sustituir `passwordHash` propio por Supabase Auth en producción.
5. Relacionar `auth.users.id` con `public.app_users.id`.
6. Mantener service role solo en backend seguro.
7. Usar función RPC para ficha pública; no consultar tablas privadas desde el cliente público.
8. Subir fotos a bucket privado con nombres `auth.uid()/uuid.ext`.
9. Validar tamaño y mime type antes de subir.
10. Eliminar archivo anterior al reemplazar foto.

## RLS esperada

- Usuario ve sus dispositivos, perfiles, contactos, escaneos, ubicaciones y notificaciones.
- Organización ve solo datos donde exista membresía activa.
- Admin/support accede por rol.
- `activation_code_hash` y `nfc_uid_hash` no se exponen públicamente.
- `location_reports`, `notification_events` y `audit_logs` no son públicos.
- La ficha pública usa función controlada.

## Pendientes después de aplicar

- Confirmar si el proyecto debe renombrarse visualmente a `HelPlis` en Supabase.
- Obtener y guardar variables reales solo en `.env.local` o proveedor de hosting.
- Agregar adaptadores de datos Supabase a la app.
- Agregar tests de Auth, Storage, RLS y RPC.
- Decidir si Prisma se mantiene para SQLite local o si se agrega Prisma PostgreSQL por ambiente.
