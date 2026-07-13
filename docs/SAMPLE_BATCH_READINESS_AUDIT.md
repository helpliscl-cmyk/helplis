# Sample Batch Readiness Audit

Fecha: 2026-07-13

## Estado actual

- Rama local auditada: `main`.
- Commit base antes de esta fase: `66edd4b`.
- Working tree inicial: limpio.
- Validacion previa ejecutada antes de cambios:
  - `npm run typecheck`: OK.
  - `npm run lint`: OK.
  - `npm run test`: OK, 62 tests.
  - `npm run test:e2e`: OK.
  - `npm run build`: OK, 52 rutas.
- Supabase CLI no esta instalado en el entorno local.
- `.env` local contiene solo `DATABASE_URL`; Supabase no esta activo como runtime local.
- Vercel CLI esta linkeado al proyecto `helplis`.

## URL grabable actual

URL fisica definitiva:

```text
https://helplis.cl/p/[publicCode]
```

No se debe grabar `/activate/[publicCode]`, activationCode, UID NFC ni rutas temporales.

Auditoria local previa encontro dispositivos seed/demo con:

- `publicUrl` correcto.
- `qrContent` nulo.
- `nfcContent` nulo.

Decision: normalizar toda creacion/importacion y agregar migracion para exigir:

```text
publicUrl === qrContent === nfcContent
```

## Comportamiento por estado

- `UNACTIVATED`: `/p/[publicCode]` identifica la pulsera, no muestra datos personales y ofrece activar.
- `ACTIVE`: `/p/[publicCode]` muestra ficha publica, registra escaneo y respeta privacidad.
- `SUSPENDED`: pantalla neutra temporal, sin datos personales, con soporte.
- `DISABLED`: pantalla neutra, sin datos personales.
- `INVALID`: error neutro.
- `REASSIGNED`: se resuelve como estado operativo actual y no expone historial ni perfil anterior.

## Sistema actual de fotografias antes de esta fase

- Componente: `app/activate/activation-form.tsx`.
- Entrada: `input type=file`, camara o galeria.
- Transporte: `FileReader.readAsDataURL`.
- Server Action: `features/activations/actions.ts`.
- Persistencia previa: `Profile.photoUrl` con data URL base64.
- Bucket Supabase: existia migracion `profile-photos`, pero no era usado por el runtime local.
- Riesgo: imagen grande en DB, URL no controlada, sin metadata, sin reemplazo/eliminacion segura.

## Riesgos

- Reutilizar codigos demo o secuenciales faciles.
- Enviar al proveedor datos no necesarios.
- Guardar fotos como base64 en DB.
- Exponer fotos aunque `showPhoto=false`.
- Conservar URLs firmadas persistidas que expiran.
- Confirmar lote SAMPLE antes de revisar URLs.

## Cambios necesarios

- Mantener `/p/[publicCode]` como unica URL fisica.
- Corregir `qrContent/nfcContent` en datos existentes y nuevas entradas.
- Procesar fotos en servidor, guardar path privado y exponer por endpoint controlado.
- Agregar preview SAMPLE de 5 unidades sin persistencia hasta confirmacion.
- Preparar export manufacturer y plantilla de retorno sin activationCode.

## Decision recomendada

Avanzar con un SAMPLE real de 5 unidades solo despues de revisar la preview en `/admin/production/sample-preview`. No generar el lote de 500 ni enviar archivos al proveedor desde esta fase.
