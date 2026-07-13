# Deployment Plan

Fecha: 2026-07-13

## Estado actual

- Produccion: `https://helplis.cl`
- Vercel project: `helplis`
- Vercel project id: `prj_6k5C9ziUzS2Fy0a7OyDyj8yuvAlQ`
- Ultima deployment inspeccionada: `dpl_2BBuxS9Z8GoDYAAn16ovZSj3CjtY`
- Estado Vercel: `READY`
- Target: `production`
- Alias activos: `helplis.cl`, `helplis.vercel.app`
- Node.js Vercel: `24.x`
- Build command efectivo en deployment: `npm run vercel:build`

## Origen de produccion

La produccion vigente fue publicada manualmente con Vercel CLI desde el estado local de `feature/supabase-integration` en el commit `5615f0a`.

El JSON de `vercel inspect --format=json` no trae metadata `githubCommitSha` ni `githubCommitRef`, por lo que Vercel no permite probar el SHA solo desde metadata. El commit de produccion se identifica por el estado local usado al ejecutar `vercel deploy --prod --yes`.

Despues de la regularizacion, `5615f0a` existe en `main`, asi que el commit actualmente desplegado ya esta contenido por la rama por defecto.

## Flujo recomendado

1. Mantener `main` como rama canonica.
2. Para cambios de producto, abrir PR hacia `main` siempre que sea posible.
3. Ejecutar checks antes de merge:
   - `npm install`
   - `npm run typecheck`
   - `npm run lint`
   - `npm run test`
   - `npm run test:e2e`
   - `npm run build`
4. Publicar produccion desde `main`.
5. Confirmar aliases y smoke tests despues de deploy.

## Validacion local 2026-07-13

Ejecutada desde `main` despues del fast-forward de `feature/supabase-integration`:

- Node local: `v22.16.0`
- npm local: `11.6.1`
- `npm install`: OK.
- `npx npm@10 install`: OK; usado para regenerar `package-lock.json` compatible con GitHub Actions.
- `npx npm@10 ci`: OK.
- `npm run db:migrate`: OK.
- `npm run db:seed`: OK.
- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm run test`: OK, 11 archivos y 52 tests.
- `npm run test:e2e`: OK, 1 flujo Playwright.
- `npm run build`: OK.

Auditoria:

- `npm audit --audit-level=moderate` reporta 2 vulnerabilidades moderadas por `next` -> `postcss`.
- npm sugiere `npm audit fix --force`, pero lo marca como cambio breaking; no se aplico automaticamente.

## Smoke tests de produccion

Verificar:

- `/`
- `/quiero-helplis`
- `/activate/HLP009`
- `/p/HLP001`
- Login/dashboard/admin
- Acciones publicas: WhatsApp, compartir ubicacion, reportar encontrado

## Riesgos pendientes

- La deployment actual fue manual; conviene conectar o documentar explicitamente el flujo Git/Vercel para que produccion salga desde `main`.
- `vercel project inspect` no muestra rama Git conectada ni production branch.
- El rate limit publico sigue siendo en memoria para runtime demo.
- La correccion de auditoria npm requiere decision de upgrade de Next/PostCSS; no se debe aplicar con `--force` sin revisar impacto.
- Mantener el lockfile compatible con npm 10 mientras `.github/workflows/ci.yml` use `actions/setup-node@v4` con Node 22 y `npm ci`.
