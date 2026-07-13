# Sample Production Workflow

## Preview

Ruta:

```text
/admin/production/sample-preview
```

La preview:

- no persiste batch;
- no reserva codigos;
- genera 5 publicCode aleatorios de 8 caracteres;
- usa `SAMPLE-HELPLIS-001`;
- usa `productionMode=SAMPLE`;
- muestra `publicUrl`, `qrContent` y `nfcContent`;
- permite regenerar, revisar, confirmar o cancelar.

Advertencia visible:

```text
Estos codigos pasaran a ser identificadores fisicos permanentes si se envian al proveedor. No podran eliminarse ni reutilizarse.
```

## Confirmacion

Solo el boton "Confirmar lote real" persiste:

- Batch `SAMPLE-HELPLIS-001`.
- 5 dispositivos `UNASSIGNED`/`UNACTIVATED`.
- `publicUrl === qrContent === nfcContent`.
- `activationCodeHash` y `activationCodeEncrypted`.
- Audit log `SAMPLE_BATCH_CONFIRMED`.

Esta tarea no confirma automaticamente el lote.

## Estados remotos

Se agregan estados no destructivos para operar el flujo:

- `AWAITING_QUOTE`
- `QUOTED`
- `APPROVED`
- `IN_PRODUCTION`
- `REMOTE_VALIDATION`
- `REMOTE_APPROVED`
- `SHIPPED`
- `RECEIVED`
- `PHYSICAL_VERIFICATION`
- `VERIFIED`
- `REJECTED`
