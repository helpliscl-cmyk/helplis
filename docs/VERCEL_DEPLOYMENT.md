# Vercel Deployment

Variables requeridas:

- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `AUTH_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PHONE`
- variables Supabase y proveedores cuando existan.

Recomendaciones:

- Usar Supabase PostgreSQL antes de producción; SQLite no es adecuado para serverless.
- No cachear rutas `/activate`, `/dashboard`, `/admin`, `/api/public/location` ni endpoints privados.
- Configurar dominio canónico `https://helplis.cl` y redirección desde `https://www.helplis.cl` o viceversa según decisión comercial.
