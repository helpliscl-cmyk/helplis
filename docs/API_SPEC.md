# API Spec

Endpoints implementados:

- `POST /api/public/contact-action`: registra acciones públicas como llamada, WhatsApp, copiar enlace, encontrado o emergencia.
- `POST /api/public/location`: registra ubicación compartida con consentimiento explícito.
- `POST /api/analytics/event`: registra eventos comerciales no sensibles como `PRICING_VIEWED`, `PACK_SELECTED`, `ORDER_INTENT_STARTED`, `ORDER_INTENT_COMPLETED` y `WHATSAPP_ORDER_CLICKED`.
- `GET /api/admin/export/batch?batchId=...`: exporta dispositivos de un lote en CSV para roles admin/support.

Server actions implementadas:

- Auth: login, registro y logout.
- Activación: `activateDeviceAction`.
- Usuario: crear perfil, crear contacto, actualizar privacidad, marcar perdido/encontrado.
- Admin: crear lote, importar CSV, crear organización y crear campaña.
- Marketing: `createPurchaseIntentAction` guarda intención de compra con pack, cantidad, precio, origen, comuna, región, uso principal, aceptación de contacto y envío pendiente.

Las respuestas públicas no devuelven activationCode, passwordHash, UID NFC ni datos ocultos por privacidad.

## Compra e intención comercial

`/quiero-helplis` no es checkout. El formulario recalcula en servidor:

- Pack 1: 1 unidad, $18.000.
- Pack 2: 2 unidades, $28.000.
- Pack 3: 3 unidades, $35.000.

El precio enviado por el navegador se valida contra el cálculo del servidor. El envío no se suma. Al completar, se crea una notificación administrativa simulada y se muestra un enlace de WhatsApp prellenado que solo se abre con acción del usuario.
