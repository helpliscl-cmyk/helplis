# Database Model

El schema Prisma implementa usuarios, dispositivos, perfiles, contactos, escaneos, activaciones, lotes, organizaciones, membresías, campañas, notificaciones, auditoría, acciones públicas, importaciones y soporte.

Campos sensibles:

- `User.passwordHash` almacena bcrypt, nunca texto plano.
- `Device.activationCodeHash` almacena bcrypt, nunca el activationCode.
- `Device.nfcUid` no se usa como autenticador único y no se muestra en fichas públicas.
- `ScanEvent.ipHash` guarda IP anonimizada.

SQLite se usa para desarrollo local. El schema usa enums y relaciones compatibles conceptualmente con PostgreSQL. Para Supabase deben agregarse RLS, policies, `auth.users` y storage externo.
