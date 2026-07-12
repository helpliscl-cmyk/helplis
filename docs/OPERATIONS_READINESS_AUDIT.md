# Operations Readiness Audit

Fecha: 2026-07-12  
Proyecto: `C:\Users\sebau\OneDrive\Escritorio\helplis`  
Producción: `https://helplis.cl`  
Commit inicial auditado: `03f9325 shorten home and move shipping copy to checkout`

## Resultado de validación inicial

| Revisión | Resultado |
| --- | --- |
| Git | Rama `feature/supabase-integration`, limpia y sincronizada con `origin/feature-supabase-integration` y `origin/main`. |
| Producción | `https://helplis.cl` responde 200, muestra precio desde $18.000 y el home no menciona envío. |
| Formulario | `/quiero-helplis?pack=2` responde 200 y mantiene selección de pack. |
| `npm run lint` | OK. |
| `npm run typecheck` | OK. |
| `npm run test` | OK, 40 tests. |
| `npm run test:e2e` | OK, flujo principal completo. |
| `npm run build` | OK, 38 rutas generadas. |

## Estado actual de datos locales

Conteo desde Prisma local después del E2E:

- Usuarios: 6.
- Dispositivos: 22.
- Lotes: 3.
- Leads retail: 3.
- Organizaciones: 2.
- Auditoría: 10 eventos.
- Notificaciones: 25.
- Activaciones: 9.

Estados observados:

- Lotes: `GENERATED`, `PARTIALLY_RECEIVED`, `RECEIVED`.
- Leads: `NEW`.

## Funciones existentes

- Home comercial corto, con precios retail y CTA de compra.
- Captura de leads retail en `/quiero-helplis`.
- Panel admin protegido por roles `ADMIN`, `SUPER_ADMIN` y `SUPPORT`.
- Activación por `publicCode + activationCode`.
- Ficha pública escaneable por QR/NFC.
- Escaneos, acciones públicas, ubicación voluntaria y notificaciones locales.
- Lotes básicos, importación CSV básica, organizaciones, campañas y soporte simple.
- Prisma/SQLite local y migración Supabase MVP con RLS y Storage para fotos.
- Deploy Vercel y dominio `helplis.cl`.

## Supabase, RLS y Auth

La migración Supabase `20260711180000_helplis_mvp.sql` habilita RLS en tablas públicas principales: usuarios, organizaciones, membresías, dispositivos, perfiles, contactos, escaneos, ubicaciones, notificaciones, soporte, importaciones, campañas y auditoría.

Políticas revisadas:

- Usuarios leen su propio perfil o admin.
- Dispositivos se leen por owner, org member o admin.
- Perfiles/contactos se leen/escriben por owner o admin.
- Escaneos y ubicaciones permiten inserción pública controlada.
- Auditoría queda visible solo para admin.
- Storage `profile-photos` restringe lectura/escritura por carpeta del usuario.

Riesgos detectados:

- El runtime actual de Vercel sigue usando SQLite demo, no Supabase como base operativa.
- La migración de pricing usa tabla `"PurchaseIntent"` con nombre Prisma, distinta del estilo snake_case del MVP Supabase inicial.
- No existe aún modelo operativo Supabase para pedidos, producción, inventario ni pagos.

## Variables y secretos

`.env.example` contiene placeholders. `.env` local solo expuso `DATABASE_URL` al revisar nombres de variables, no valores.

Búsqueda en Git:

- No se encontraron claves reales `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `AUTH_SECRET`, tokens GitHub, claves privadas ni URLs Postgres con password fuera de archivos esperados de documentación/configuración.

## Vacíos operativos

### Fabricación

- No hay módulo de producción por proveedor.
- No existe distinción formal entre lote demo, muestra y producción masiva.
- Los archivos de proveedor no se generan como paquete descargable.
- No hay plantilla XLSX, QR PNG/SVG ni ZIP con checksums.

### Identidad digital

- `Device` tiene `publicCode`, `publicUrl`, `nfcUid` y `activationCodeHash`, pero falta formalizar `qrContent`, `nfcContent`, `internalSequence`, estados de producción, verificación e inventario.
- El `activationCode` se hashea, pero no existe flujo auditado para revelarlo en packing.

### UID y recepción

- La importación actual es genérica de CSV, no está orientada a retorno de proveedor.
- Faltan validaciones de UID duplicado, lote incorrecto, URL distinta y modo simulación.

### Verificación física

- No existe vista móvil para verificar QR, NFC, UID, daño, faltantes ni rechazo de unidades.
- No hay reportes de reclamo al proveedor.

### Inventario

- `Device.status` cubre parte de disponibilidad, pero falta inventario operacional: ubicación física, reservas, asignaciones, stock disponible y doble reserva.

### Pedidos y fulfillment

- `PurchaseIntent` no se convierte todavía en `Order`.
- No existen pedidos, ítems, pagos, envíos, packing, tarjeta de activación ni tracking.

### Instituciones y soporte

- Organizaciones existen, pero falta lead institucional público/admin y pipeline comercial.
- Soporte existe como mensaje simple, no como ticket vinculable a pedido, dispositivo, lote u organización.

### CRM, backups y recuperación

- No existe especificación de sincronización CRM.
- No existen exportaciones administrativas de emergencia para pedidos, UID, lotes, activaciones ni auditoría.

## Riesgos

- Riesgo de operación manual sin trazabilidad si se empieza a fabricar antes de crear producción/inventario/pedidos.
- Riesgo de mezclar demo y producción si no se marca cada lote con `productionMode`.
- Riesgo de doble asignación de pulseras sin reservas transaccionales.
- Riesgo de exposición de `activationCode` si se imprime o exporta sin controles.
- Riesgo de CSV/XLSX injection en import/export si no se neutralizan fórmulas.
- Riesgo de IDOR en nuevas rutas dinámicas si no se mantiene `requireRole`.
- Riesgo de depender de SQLite demo en producción hasta conectar backend operativo real.

## Prioridades

1. Extender modelo de datos operativo sin duplicar `Device`, `Batch`, `PurchaseIntent`, `Organization`, `NotificationEvent` ni `AuditLog`.
2. Crear producción: lotes, generación de códigos, exportación para proveedor y retorno UID.
3. Crear verificación física e inventario.
4. Convertir leads a pedidos.
5. Agregar pagos/envíos manuales y packing con `activationCode` protegido.
6. Crear tablero de operaciones.
7. Fortalecer instituciones, soporte, CRM, seguridad y backups.
8. Agregar E2E operativo con lote demo de 5 unidades.

## Decisiones pendientes

- Proveedor real y formato final de archivo.
- Si el proveedor necesitará imágenes QR o solo URLs.
- Política final de envío, costos y zonas.
- Medio de pago real.
- Conexión definitiva a Supabase runtime.
- Política formal de retención de auditoría, UID y datos personales.
