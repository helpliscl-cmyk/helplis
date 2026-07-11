# Deployment Plan

El MVP corre local. Para producción:

1. Crear repositorio GitHub privado.
2. Configurar variables sin secretos en repo y secretos en Vercel.
3. Migrar SQLite a Supabase PostgreSQL.
4. Activar Supabase Auth y RLS.
5. Desplegar Vercel preview.
6. Conectar dominio `helplis.cl` y `www.helplis.cl`.
7. Configurar Cloudflare DNS/SSL/cache.
8. Ejecutar pruebas E2E contra preview.
9. Revisar logs, headers y cumplimiento de privacidad.
