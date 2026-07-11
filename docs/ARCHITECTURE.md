# Architecture

La aplicación usa Next.js App Router. Las páginas públicas, dashboard y admin viven en `app/`; los componentes reutilizables en `components/`; la lógica por dominio en `features/`; utilidades compartidas en `lib/`; y acceso a datos/servicios en `server/`.

Capas principales:

- UI: server components para lectura y client components solo cuando se requiere navegador, como geolocalización.
- Auth: `iron-session` local en `lib/auth/session.ts`.
- Datos: Prisma Client en `server/db/client.ts`.
- Dominio: servicios de códigos, activación, perfil público, importación, métricas y notificaciones.
- Integraciones futuras: interfaces y docs para Supabase, Vercel, Cloudflare, CRM, storage y proveedores de mensajes.

El diseño evita acoplar la UI a SQLite. Las consultas están concentradas en server components y servicios para facilitar el reemplazo por repositorios Supabase/PostgreSQL.
