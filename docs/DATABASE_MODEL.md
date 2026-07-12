# Database Model

El schema Prisma implementa usuarios, dispositivos, perfiles, contactos, escaneos, activaciones, lotes, organizaciones, membresías, campañas, notificaciones, auditoría, acciones públicas, importaciones y soporte.

Campos sensibles:

- `User.passwordHash` almacena bcrypt, nunca texto plano.
- `Device.activationCodeHash` almacena bcrypt, nunca el activationCode.
- `Device.nfcUid` no se usa como autenticador único y no se muestra en fichas públicas.
- `ScanEvent.ipHash` guarda IP anonimizada.

SQLite se usa para desarrollo local. El schema usa enums y relaciones compatibles conceptualmente con PostgreSQL. Para Supabase deben agregarse RLS, policies, `auth.users` y storage externo.

## PurchaseIntent comercial

`PurchaseIntent` registra solicitudes o intenciones de compra, no ventas confirmadas.

Campos comerciales agregados:

- `region`: región informada por el comprador.
- `packId`: 1, 2 o 3.
- `quantity`: cantidad derivada del pack.
- `unitPrice`: precio por unidad redondeado.
- `totalPrice`: precio retail del pack sin envío.
- `shippingPending`: indica que el envío se cotiza o informa aparte.
- `origin`: origen comercial del lead.
- `status`: estado operativo inicial `NEW`; estados sugeridos: `CONTACTED`, `QUOTED`, `PAYMENT_PENDING`, `PAID`, `PREPARING`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `LOST`.

El modelo no almacena datos de pago porque no existe checkout implementado.

## AnalyticsEvent comercial

Eventos nuevos:

- `PRICING_VIEWED`
- `PACK_SELECTED`
- `PACK_1_SELECTED`
- `PACK_2_SELECTED`
- `PACK_3_SELECTED`
- `ORDER_INTENT_STARTED`
- `ORDER_INTENT_COMPLETED`
- `WHATSAPP_ORDER_CLICKED`

La metadata puede incluir pack, cantidad, precio, origen, página y `sessionId`. No debe incluir información sensible innecesaria.
