# Supabase RLS

Fecha: 2026-07-13

Principios:

- El responsable administra sus perfiles.
- Las fotos quedan protegidas por owner en `profile-photos`.
- La ruta esperada es `users/[auth.uid]/profiles/[profileId]/[random].webp`.
- La lectura publica de fotos pasa por endpoint servidor, no por policies anon.
- La ficha publica devuelve solo campos permitidos.
- `criticalInformation` solo se entrega si `show_critical_information = true`.
- Los telefonos no aparecen en HTML por defecto.
- Llamada y WhatsApp se resuelven por endpoint seguro.
- `activationCode` continua protegido.

Roles operativos legacy (`SUPPORT`, `OPERATIONS`, `ADMIN`, `SUPER_ADMIN`) se mantienen para paneles internos.
