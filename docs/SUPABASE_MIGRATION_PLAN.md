# Supabase Migration Plan

Migración propuesta:

- Convertir SQLite a PostgreSQL con Prisma migrations.
- Reemplazar `User` local por integración con `auth.users`; mantener tabla de perfil interno si hace falta.
- Activar RLS por usuario, organización y rol admin.
- Mover fotos a Supabase Storage.
- Insertar scans públicos mediante route handlers controlados.
- Mantener activationCodeHash y nfcUid privados.
- Usar Edge Functions para notificaciones futuras.
- Habilitar backups y migraciones por ambiente.

Políticas RLS conceptuales:

- Usuario ve solo sus dispositivos, perfiles, contactos, scans y notificaciones.
- Organización ve solo datos de su organización.
- Admin accede según rol.
- Ficha pública devuelve solo campos autorizados por una función segura.
- AuditLog y NotificationEvent no son públicos.
