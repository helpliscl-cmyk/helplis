# Supabase Storage

Fecha: 2026-07-13

## Bucket

- Nombre: `profile-photos`.
- Tipo: privado.
- Maximo original: 5 MB.
- MIME permitidos: `image/jpeg`, `image/png`, `image/webp`.

## Ruta

```text
users/[userId]/profiles/[profileId]/[randomId].webp
```

No se usan nombres personales, publicCode, email, telefono ni UID.

## Politicas versionadas

Migraciones:

- `20260713100000_profile_photo_storage.sql`
- `20260713160000_profile_photo_storage_metadata.sql`

Politicas:

- Usuario autenticado lee solo su carpeta.
- Usuario autenticado sube solo bajo `users/auth.uid()/`.
- Usuario autenticado actualiza solo su carpeta.
- Usuario autenticado elimina solo su carpeta.
- Operaciones publicas no leen Storage directamente: pasan por endpoint servidor.

## Runtime

- Cliente nunca usa service role.
- Servidor usa Supabase Storage si existen `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.
- Local/test usa `data/profile-photos` como storage privado, no `public/`.

## Endpoint publico

`/api/public/profile-photo/[profileId]` valida:

- perfil existente;
- perfil publico;
- `showPhoto=true`;
- `photoStoragePath` presente;
- pulsera vinculada en estado operativo activo;
- objeto disponible.

Responde con `cache-control: private, no-store, max-age=0`.
