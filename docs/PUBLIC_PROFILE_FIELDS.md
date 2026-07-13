# Public Profile Fields

Fecha: 2026-07-13

## Primera version

- `displayName`
- `showDisplayName`
- `photoUrl`
- `showPhoto`
- `helpMessage`
- `criticalInformation`
- `showCriticalInformation`
- `allowCall`
- `allowWhatsApp`
- `allowLocationSharing`
- `allowFoundReport`

## Contactos

Cada perfil activado inicialmente tiene dos contactos:

- `type`: `PRIMARY` o `SECONDARY`
- `relationshipCode`: `MOTHER`, `FATHER`, `FAMILY`, `RESPONSIBLE`
- `phone`: guardado como `+569XXXXXXXX`
- `callEnabled`
- `whatsappEnabled`

## Campos legacy

Campos de mascotas, objetos, equipaje, activos y medicina granular pueden quedar en el modelo para compatibilidad futura, pero no se exponen en la primera version comercial.
