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

## SAMPLE final supplier return file

El paquete final `exports/SUPPLIER-SAMPLE-001` incluye:

```text
05-supplier-return-template.xlsx
```

Columnas:

- `Wristband Reference`
- `Public Code`
- `Public URL`
- `NFC UID`
- `QR Test Result`
- `NFC Test Result`
- `Physical Condition`
- `Notes`

Las columnas `Wristband Reference`, `Public Code` y `Public URL` vienen prellenadas para `SJRUPNZQ`, `BCM3BLAJ`, `H26EJYQW`, `THAHHRYR` y `TCR6MTJB`.

Emilia debe devolver vacios completados con el UID real leido desde cada NTAG213. No se debe cambiar el `Public Code`, la `Public URL`, el QR ni el NFC programado.
