# Supplier Return Import

Ruta:

```text
/admin/production/[batchId]/supplier-return
```

Template SAMPLE:

```text
Wristband Reference,Public Code,Public URL,NFC UID,QR Test Result,NFC Test Result,Notes
```

Reglas:

- Emilia debe devolver UID real; HelPlis no lo inventa.
- `Public URL` debe coincidir con la URL esperada.
- `QR Test Result` y `NFC Test Result` deben indicar OK/pass.
- No se acepta cambiar `publicCode`.
- No se acepta cambiar URL permanente.
- Duplicados de UID se rechazan.

La preview de importacion puede correr en modo simulacion sin actualizar dispositivos.
