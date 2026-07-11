# Vercel Deployment Plan

Fecha: 2026-07-11.

No se configuró Vercel en esta fase porque la cuenta presenta problemas de verificación. No se debe evadir la verificación, crear cuentas alternativas ni usar credenciales de terceros.

## Preparación actual

- App compatible con `npm run build`.
- Dominio canónico definido en metadata: `https://helplis.cl`.
- Open Graph configurado con asset oficial.
- Variables documentadas en `.env.example`.
- SQLite se mantiene para desarrollo local; producción debe usar PostgreSQL/Supabase.

## Variables para Vercel

Configurar solo cuando la cuenta esté verificada:

- `NEXT_PUBLIC_APP_URL=https://helplis.cl`
- `AUTH_SECRET`
- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_PROFILE_BUCKET=profile-photos`
- Proveedores reales de email/SMS/WhatsApp cuando existan.

Nunca subir valores secretos al repositorio.

## Build

Comandos esperados:

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
```

## Dominios

- Dominio canónico: `helplis.cl`
- `www.helplis.cl` debe redirigir a `https://helplis.cl`.

## Cloudflare futuro

No cambiar DNS hasta que Vercel esté listo.

Registros a conservar:

- MX del correo.
- SPF.
- DKIM.
- DMARC.
- CNAME/A para web cuando Vercel entregue los targets.

Recomendación futura:

- `helplis.cl` apuntando a Vercel según instrucción del panel.
- `www.helplis.cl` como CNAME a Vercel o redirección configurada en Vercel.
- Mantener proxy/SSL de Cloudflare solo si no interfiere con validación de dominio.

## Pendientes

- Verificar cuenta Vercel.
- Conectar repositorio GitHub correcto.
- Configurar variables de producción.
- Ejecutar primer deploy preview.
- Revisar logs.
- Activar dominio canónico.
- Configurar redirección `www -> root`.
