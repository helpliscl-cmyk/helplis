# Import Workflow

Formato CSV:

```csv
publicCode,publicUrl,nfcUid,productType
HLPX01,https://helplis.cl/p/HLPX01,04:AA:BB:01,WRISTBAND
```

Validaciones:

- publicCode alfanumérico de 4 a 12 caracteres.
- URL exacta `https://helplis.cl/p/[publicCode]`.
- publicCode duplicado en archivo o base.
- UID NFC duplicado en archivo o base.
- productType conocido; si no, se normaliza a `WRISTBAND` en la función pura.

Las filas válidas se importan como dispositivos disponibles con activationCode hasheado generado localmente.
