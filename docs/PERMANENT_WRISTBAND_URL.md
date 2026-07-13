# Permanent Wristband URL

La URL fisica de cada HelPlis es permanente durante toda la vida del dispositivo:

```text
https://helplis.cl/p/[publicCode]
```

Reglas:

- `publicUrl`, `qrContent` y `nfcContent` deben ser identicos.
- QR y NFC contienen solo esa URL.
- No se incluye `activationCode`.
- No se incluye UID NFC.
- No se usa `/activate/[publicCode]` como URL fisica.
- No se usan rutas temporales ni acortadores.

`/p/[publicCode]` resuelve el estado operativo:

- No activada: pantalla de activacion, sin datos personales.
- Activa: ficha publica y registro de escaneo.
- Suspendida/deshabilitada: pantalla neutra.
- Invalida: error neutro.

La activacion se inicia desde `/p/[publicCode]` con boton "Activar esta HelPlis" y continua en `/activate/[publicCode]` con el codigo ya identificado.
