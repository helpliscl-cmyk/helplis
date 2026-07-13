# Device States

Fecha: 2026-07-13

HelPlis normaliza estados operativos internos a estados publicos controlados:

| Estado | Equivalentes internos | Comportamiento |
| --- | --- | --- |
| `UNACTIVATED` | `AVAILABLE`, `UNASSIGNED`, `RESERVED` | QR/NFC abre activacion. No hay ficha publica. |
| `ACTIVE` | `ACTIVATED`, `LOST`, `FOUND` | QR/NFC abre ficha publica y registra escaneo. |
| `SUSPENDED` | `SUSPENDED` | Pantalla neutra temporal, sin datos personales, con soporte. |
| `DISABLED` | `DEACTIVATED`, `REPLACED`, `DAMAGED` | Pantalla neutra, sin datos personales. |
| `REASSIGNED` | Activa con audit log `DEVICE_PROFILE_REASSIGNED` | Estado de administracion; la ficha publica muestra el perfil nuevo. |

`REASSIGNED` no cambia `publicCode`, QR ni UID NFC. Solo indica que el perfil publico vinculado fue cambiado desde dashboard autenticado.

## API

`/api/activation/validate` devuelve solo datos de control:

- `state`
- `publicCode`
- `publicProfileUrl` para `ACTIVE`
- `managementUrl` para `ACTIVE`

No devuelve owner, correo, telefono, UID NFC, activationCode ni datos de perfil.
