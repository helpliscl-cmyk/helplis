# HelPlis

MVP local de identificación y contacto mediante códigos QR y chips NFC.

Dominio oficial previsto: `https://www.helplis.cl`  
Dominio base usado por el sistema: `https://helplis.cl`  
Contacto provisional: Sebastian Urrea, `Admin@helplis.cl`, `+56 9 8845 5230`

## Stack

- Next.js App Router, React, TypeScript estricto y Tailwind CSS.
- Prisma ORM con SQLite local.
- `iron-session` para autenticación local provisional.
- Zod, bcryptjs, Vitest y Playwright.
- Proveedores locales/mock para notificaciones, analítica y storage futuro.

## Setup local

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

El proyecto queda disponible en `http://localhost:3000`.

## Credenciales demo

Todos los usuarios demo usan:

```text
HelPlisDemo123!
```

Usuarios:

- `admin@demo.helplis.cl` - SUPER_ADMIN
- `soporte@demo.helplis.cl` - SUPPORT
- `colegio@demo.helplis.cl` - ORGANIZATION_ADMIN
- `usuario@demo.helplis.cl` - USER
- `familia@demo.helplis.cl` - USER

Activación local de prueba:

- publicCode: `HLP009`
- activationCode de demo: `ACT-HLP009`

El activationCode se guarda hasheado en SQLite. El valor anterior existe solo para operar el entorno demo.

## Scripts

- `npm run dev`: inicia Next.js.
- `npm run build`: build de producción.
- `npm run start`: sirve el build.
- `npm run lint`: ESLint.
- `npm run format`: Prettier.
- `npm run test`: pruebas unitarias Vitest.
- `npm run test:watch`: Vitest watch.
- `npm run test:e2e`: pruebas Playwright.
- `npm run db:migrate`: genera Prisma Client y aplica migraciones SQLite con respaldo local.
- `npm run db:reset`: recrea SQLite y ejecuta seed.
- `npm run db:seed`: datos demo ficticios.
- `npm run db:studio`: Prisma Studio.
- `npm run generate:batch`: genera lote y muestra CSV de fabricación local.
- `npm run import:batch`: importa `data/example-import.csv` o ruta indicada.
- `npm run export:batch`: exporta dispositivos por lote.
- `npm run verify:batch`: valida URLs, duplicados y hashes.
- `npm run typecheck`: TypeScript.

## Rutas principales

- `/`: home provisional.
- `/p/[publicCode]`: ficha pública con registro de escaneo.
- `/activate` y `/activate/[publicCode]`: activación por publicCode + activationCode.
- `/login`, `/register`, `/forgot-password`: auth local.
- `/dashboard/*`: panel usuario.
- `/admin/*`: panel administrador.
- `/o/[organizationSlug]`: landing institucional.
- `/support`: soporte local.

## Seguridad y privacidad

- Contraseñas y activation codes se hashean con bcrypt.
- La ubicación solo se solicita al pulsar el botón explícito.
- La ficha pública se construye con una proyección de privacidad.
- No se envían notificaciones reales; se guardan como `NotificationEvent`.
- No se debe usar UID NFC como autenticación.

Ver documentación completa en `docs/`.
