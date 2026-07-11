# API Spec

Endpoints implementados:

- `POST /api/public/contact-action`: registra acciones públicas como llamada, WhatsApp, copiar enlace, encontrado o emergencia.
- `POST /api/public/location`: registra ubicación compartida con consentimiento explícito.
- `GET /api/admin/export/batch?batchId=...`: exporta dispositivos de un lote en CSV para roles admin/support.

Server actions implementadas:

- Auth: login, registro y logout.
- Activación: `activateDeviceAction`.
- Usuario: crear perfil, crear contacto, actualizar privacidad, marcar perdido/encontrado.
- Admin: crear lote, importar CSV, crear organización y crear campaña.

Las respuestas públicas no devuelven activationCode, passwordHash, UID NFC ni datos ocultos por privacidad.
