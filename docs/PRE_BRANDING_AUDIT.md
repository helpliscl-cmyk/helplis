# Pre-Branding MVP Audit

Fecha: 2026-07-11.

## Estado inicial

- Rama inicial: `master`.
- Commits locales antes de esta fase: 5.
- Servidor activo observado: `http://localhost:3108`.
- Base del MVP: Next.js 16, Prisma/SQLite, rutas públicas, dashboard, admin, importaciones, notificaciones locales y E2E Playwright.

## Pruebas iniciales

| Comando | Resultado |
| --- | --- |
| `npm run lint` | OK |
| `npm run typecheck` | OK |
| `npm run test` | OK, 4 archivos y 33 tests |
| `npm run build` | OK |
| `npm run test:e2e` | Bloqueado por entorno: Next detectó otro `next dev` activo en el mismo directorio, PID 5348, puerto 3108. |

## Rutas revisadas

| Ruta | Observación |
| --- | --- |
| `/` | Funcionaba, pero comunicaba "MVP local provisional" y no integraba branding oficial. |
| `/login` | Login local con credenciales demo; faltaba marca visual. |
| `/register` | Registro local simple; faltaba contexto de producto. |
| `/activate` y `/activate/HLP009` | Formulario funcional, pero sin progreso visual ni guía por pasos. |
| `/p/HLP009` | Estado no activado correcto tras reset de prueba; faltaba tratamiento visual de marca. |
| `/support` | Formulario local funcional; textos muy provisionales. |
| `/dashboard/*` | Navegación y páginas internas operativas; shell sin logo oficial. |
| `/admin/*` | Métricas, lotes, importación y notificaciones locales visibles. |
| `/o/demo` | 404 estándar de Next. |

## Hallazgos

- La arquitectura del MVP está ordenada y las pruebas base pasan.
- La experiencia pública no transmitía todavía una empresa tecnológica moderna.
- Los textos técnicos de desarrollo estaban visibles para usuarios finales.
- La activación pedía datos correctos, pero la jerarquía no guiaba el avance.
- La ficha pública tenía buenas acciones, pero podía mejorar urgencia, privacidad y feedback offline.
- Faltaban assets oficiales, favicon, Open Graph y documentación de marca.
- GitHub no tenía remote local configurado.
- Supabase existía como proyecto vacío asociado a la organización, pero sin tablas.

## Prioridades aplicadas

1. Integrar branding oficial y metadata.
2. Rediseñar home mobile-first sin copiar a SOSMee.
3. Mejorar activación y ficha pública sin romper tests.
4. Documentar benchmark, GitHub, Supabase y Vercel.
5. Mantener SQLite local y preparar migración Supabase con RLS.
