# Validacion MIME Rancagua - URL vigente preflight

Fecha: 2026-07-13T22:44:53.193Z

## URL corregida

- MIME_BASE_URL: https://mi.mineduc.cl/mime-web
- Ficha construida: https://mi.mineduc.cl/mime-web/mvc/mime/ficha?rbd=2123

## Prueba previa sin persistencia

- RBD consultado: 2123
- requestedUrl: https://mi.mineduc.cl/mime-web/mvc/mime/ficha?rbd=2123
- finalUrl: https://mi.mineduc.cl/mime-web/mvc/mime/ficha?rbd=2123
- redirected: false
- HTTP status: 200
- contentType: text/html;charset=UTF-8
- HTML guardado: C:\Users\sebau\OneDrive\Escritorio\helplis\tests\fixtures\mime\real-rancagua-current-2123.html
- Contiene ficha institucional real: false
- Resultado parser: MIME_ERROR_PAGE
- Mensaje parser: MIME devolvio una pagina de error generico con HTTP 200.

## Campos extraidos

- Sin campos extraidos: el parser no recibio una ficha institucional valida.

## Decision

- Preflight fallido. No se creo job y no se consultaron los otros nueve RBD.

## Muestra Rancagua solicitada

| RBD | Resultado |
| --- | --- |
| 2112 | No consultado: la prueba previa de 2123 fallo. |
| 2123 | Consultado una vez sin persistencia; HTTP 200; `MIME_ERROR_PAGE`; sin ficha institucional real. |
| 2133 | No consultado: la prueba previa de 2123 fallo. |
| 15503 | No consultado: la prueba previa de 2123 fallo. |
| 15769 | No consultado: la prueba previa de 2123 fallo. |
| 11256 | No consultado: la prueba previa de 2123 fallo. |
| 2166 | No consultado: la prueba previa de 2123 fallo. |
| 15707 | No consultado: la prueba previa de 2123 fallo. |
| 2150 | No consultado: la prueba previa de 2123 fallo. |
| 2194 | No consultado: la prueba previa de 2123 fallo. |

## Porcentajes

- Correo institucional valido: no calculado; no hubo fichas reales persistidas.
- Telefono: no calculado; no hubo fichas reales persistidas.
- Web: no calculado; no hubo fichas reales persistidas.
- Sostenedor identificado: no calculado; no hubo fichas reales persistidas.

## Errores del parser

- RBD 2123: `MIME_ERROR_PAGE`. MIME respondio HTTP 200 con una pagina generica de error, no con una ficha institucional.

## Correcciones implementadas

- URL vigente centralizada en `MIME_BASE_URL=https://mi.mineduc.cl/mime-web`.
- Ficha construida con `/mvc/mime/ficha?rbd={RBD}` mediante `buildMimeUrl`.
- Registro de `requestedUrl`, `finalUrl`, `redirected`, `contentType` y status HTTP por intento.
- Deteccion de `MIME_ERROR_PAGE` preservada para respuestas HTTP 200 genericas.
- Redirecciones no se tratan automaticamente como fallo si el HTML parsea como ficha valida.
- Parser de contactos clasifica correos por etiqueta/seccion y no promueve correos genericos de Mineduc a `contactEmail`.
- Normalizacion de `mailto:` con query, URL sin protocolo y telefonos multiples.
- Script de validacion con preflight 2123 sin persistencia antes de crear el job de 10.
- Fixtures de esta segunda validacion usan prefijo `real-rancagua-current-*` para no pisar el primer intento fallido.

## Correos descartados

- No hubo correos extraidos en el preflight porque MIME no entrego ficha institucional real.
- Los tests cubren descarte/no promocion de `ayuda@mineduc.cl` como `GENERIC_MINEDUC` y correos de centro de padres, centro de alumnos, consejo escolar y direccion como no principales cuando corresponda.

## Fixtures y tests

- `tests/fixtures/mime/complete.html`: ficha completa local.
- `tests/fixtures/mime/no-email.html`: ficha sin correo institucional.
- `tests/fixtures/mime/multiple-emails.html`: varios correos por seccion.
- `tests/fixtures/mime/url-without-protocol.html`: pagina web sin protocolo.
- `tests/fixtures/mime/multiple-phone.html`: telefono multiple.
- `tests/fixtures/mime/mime-error.html`: pagina de error HTTP 200.
- `tests/fixtures/mime/real-rancagua-current-2123.html`: HTML real del preflight fallido con URL vigente.
- `tests/unit/mime-parser.test.ts`: URL vigente, contactos, URL sin protocolo, telefonos multiples y error HTTP 200.
- `tests/unit/mime-worker.test.ts`: metadata de redireccion y compatibilidad de worker.

## Archivos modificados principales

- `.env.example`
- `server/mime/types.ts`
- `server/mime/parser.ts`
- `server/mime/normalization.ts`
- `server/mime/persistence.ts`
- `server/mime/worker.ts`
- `prisma/schema.prisma`
- `prisma/migrations/20260713190000_mime_current_url_metadata/migration.sql`
- `scripts/db-migrate.ts`
- `scripts/mime-validate-rancagua-real.ts`
- `scripts/mime-seed-sample.ts`
- `prisma/seed.ts`
- `docs/MIME_MINEDUC_CRM.md`
- `tests/unit/mime-parser.test.ts`
- `tests/unit/mime-worker.test.ts`
- `tests/fixtures/mime/multiple-emails.html`
- `tests/fixtures/mime/url-without-protocol.html`
- `tests/fixtures/mime/multiple-phone.html`

## Validaciones locales

- `npm run db:migrate`: OK.
- SQLite local: columnas confirmadas (`Establishment.averageStudentsPerCourse`, `ScrapeAttempt.requestedUrl/finalUrl/redirected/contentType`, `Contact.contactType/label/section`).
- `npm run test -- tests/unit/mime-parser.test.ts tests/unit/mime-worker.test.ts`: OK, 15 tests.
- `npm run mime:validate-rancagua`: OK; preflight detenido sin crear job completo.
- `npm run typecheck`: OK.
- `npm run test`: OK, 94 tests.
- `npm run lint`: OK.
- `npm run build`: OK.

## Evidencia historica

- Se mantiene el informe del primer intento fallido: `docs/mime-validation/rancagua-real-validation-2026-07-13T22-22-29-376Z.md`.
