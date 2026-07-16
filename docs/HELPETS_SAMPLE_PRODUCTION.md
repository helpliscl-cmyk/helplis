# Helpets Sample Production

Ruta admin:

`/admin/production/helpets-sample-preview`

## Preview

El preview genera exactamente 5 candidatos para `SAMPLE-HELPETS-001` sin persistir `Batch` ni `Device`.

Cada fila muestra:

- `Tag Reference`
- `Public Code`
- `Public URL`
- `QR Content`
- `NFC Content`
- `productLine`
- `profileType`
- `deviceType`
- estado inicial

Debe cumplirse siempre:

`Public URL = QR Content = NFC Content`

## Confirmacion

La confirmacion queda preparada para ejecutarse solo cuando el administrador la apruebe manualmente.

Al confirmar:

- se crea 1 `Batch`;
- se crean exactamente 5 `Device`;
- se persisten los mismos 5 candidatos vistos en el preview;
- se generan `activationCodeHash` y credencial cifrada interna;
- se registra `AuditLog`;
- todo corre en una transaccion PostgreSQL;
- un doble submit o referencia duplicada se bloquea.

No se debe confirmar `SAMPLE-HELPETS-001` sin autorizacion explicita.

## Estados

El lote se crea en `AWAITING_QUOTE`. No avanza automaticamente a produccion, envio ni verificacion.
