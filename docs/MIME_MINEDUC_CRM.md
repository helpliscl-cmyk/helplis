# MIME Mineduc CRM

## Arquitectura Existente

HelPlis usa Next.js App Router, Prisma Client, SQLite local y rutas administrativas bajo `app/admin`. La lógica de dominio vive en `server/` y las acciones de formulario en `features/`. El módulo MIME respeta esa separación:

- `server/mime/parser.ts`: adaptador aislado con Cheerio para fichas MIME.
- `server/mime/importer.ts`: preview y commit idempotente de CSV/XLSX por RBD.
- `server/mime/worker.ts`: jobs persistentes, pausables y conservadores. Construye fichas desde `MIME_BASE_URL` + `/mvc/mime/ficha?rbd={RBD}`.
- `server/mime/persistence.ts`: upsert por RBD, sostenedores, contactos, cambios y CRM.
- `app/admin/mime/*`: panel de scraping, importación, establecimientos, ficha, sostenedores, pipeline y tareas.

## Decisiones Técnicas

- Se reutilizó el modelo `Organization` existente y se agregaron campos comerciales opcionales. Crear otro modelo `Organization` habría duplicado un concepto ya central en HelPlis.
- `RBD` se guarda como `Int` único. No se fusionan establecimientos con RBD diferentes.
- Los datos ausentes o `Sin información` se guardan como `null`.
- El hash se calcula sobre campos institucionales relevantes. Si no cambia, solo se actualiza `sourceCheckedAt`.
- El worker mantiene concurrencia `1`, respeta `Retry-After`, pausa ante 403/429 repetidos y no ejecuta scraping nacional automáticamente.
- La lista de exclusión se modela en `Suppression` y la marca operativa en `doNotContact`.
- El puntaje HelPlis es configurable por código y se muestra como desglose, no como verdad absoluta.

## URL MIME y Contactos

- URL base vigente: `MIME_BASE_URL=https://mi.mineduc.cl/mime-web`.
- Ficha por RBD: `/mvc/mime/ficha?rbd={RBD}`.
- Scripts, tests y UI deben usar `buildMimeUrl`; no se debe repartir la URL completa en varios archivos.
- Las respuestas HTTP 200 con error generico de MIME se conservan como `MIME_ERROR_PAGE`.
- Cada intento registra `requestedUrl`, `finalUrl`, `redirected`, `contentType` y status HTTP.
- Una redireccion no se considera fallo por si sola si el destino sigue siendo una ficha valida.
- Los correos se clasifican por etiqueta/seccion antes de elegir contacto principal. Correos genericos de Mineduc u otras secciones se guardan clasificados, pero no se promueven a `contactEmail`.

## Uso Local

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

Entrar al admin y abrir `/admin/mime`.

Flujos principales:

- Crear `SAMPLE`: crea un job acotado con 5 RBD por defecto.
- Ejecutar job: acción manual desde el panel.
- Importar RBD: `/admin/mime/imports`, generar vista previa y confirmar.
- Revisar CRM: `/admin/mime/establishments`, `/admin/mime/holders`, `/admin/mime/pipeline`, `/admin/mime/tasks`.

## Variables

```env
MIME_USER_AGENT="HelPlis MIME research bot (contacto: admin@helplis.cl; purpose: public institutional CRM)"
MIME_BASE_URL="https://mi.mineduc.cl/mime-web"
MIME_MIN_DELAY_MS="3000"
MIME_JITTER_MS="1500"
MIME_MAX_RETRIES="3"
MIME_BACKOFF_BASE_MS="2000"
MIME_REQUEST_TIMEOUT_MS="15000"
MIME_MAX_CONSECUTIVE_BLOCKED="3"
MIME_SKIP_RECENT_DAYS="30"
MIME_SAMPLE_LIMIT="5"
```

## Pruebas

Las pruebas usan fixtures locales en `tests/fixtures/mime`. No hacen requests a MIME.

```bash
npm run test -- --run tests/unit/mime-parser.test.ts tests/unit/rbd-import.test.ts tests/unit/mime-worker.test.ts
npm run typecheck
npm run lint
npm run build
```

## Limitaciones

- No se implementan campañas ni envíos automáticos de correo.
- El worker se dispara manualmente desde server actions; para producción conviene moverlo a un proceso/background runner con el mismo modelo persistente.
- Los selectores MIME están diseñados para etiquetas semánticas, pero deben revisarse si MIME cambia la estructura pública.
- El importador XLSX soporta la primera hoja del libro.
- La muestra seed es local/demo y no reemplaza una importación oficial del universo nacional.
