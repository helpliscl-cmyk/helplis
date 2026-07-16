# Helpets Physical UID Capture

Ruta admin:

`/admin/production/[batchId]/physical-uid-capture`

## Uso

La captura UID se realiza despues de recibir fisicamente las placas Helpets.

El administrador debe:

1. abrir el lote Helpets confirmado;
2. entrar a `Captura UID fisica`;
3. seleccionar `Tag Reference`;
4. leer el UID NFC real;
5. registrar el UID.

## Reglas

- El UID no es requerido antes de fabricar.
- No cambia `publicCode`.
- No cambia QR.
- No cambia NFC URL.
- No cambia `publicUrl`.
- Se bloquean UID duplicados.
- Se registra `PhysicalVerification`.
- Se registra `AuditLog`.

La verificacion completa de QR/NFC fisicos sigue siendo un paso posterior.
