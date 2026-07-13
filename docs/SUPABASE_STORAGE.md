# Supabase Storage

Fecha: 2026-07-13

Bucket:

- `profile-photos`
- Privado.
- Maximo 5 MB.
- MIME permitidos: JPEG, PNG, WebP.

Politicas:

- El usuario autenticado solo puede operar dentro de su carpeta `auth.uid()/`.
- Upload/update requieren nombres aleatorios largos con extension permitida.
- Sin bucket listing publico.
- Lectura por owner; entrega publica debe hacerse por URL firmada o capa controlada.
- No se permiten ejecutables por MIME ni extension.
