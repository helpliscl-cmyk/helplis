# Profile Photo Storage Audit

Fecha: 2026-07-13

## Antes

- Componente de carga: `app/activate/activation-form.tsx`.
- Acciones UI: tomar foto, elegir desde galeria, reemplazar seleccion, eliminar seleccion.
- Transporte: data URL en `photoDataUrl`.
- Server Action: `features/activations/actions.ts`.
- Servicio: `server/services/activation.ts`.
- Campo persistido: `Profile.photoUrl`.
- Valor persistido: data URL base64 si pasaba regex.
- Bucket usado: ninguno en runtime.
- Bucket Supabase versionado: `profile-photos`, privado, solo en migraciones.
- `photoStoragePath`: no existia en Prisma.
- URL firmada: no se generaba.
- Redimensionamiento/compresion: no existia.
- EXIF: no se corregia ni limpiaba.
- Limite UI previo: 1.2 MB.
- Formatos UI: JPEG, PNG, WebP.
- Reemplazo persistente: no existia.
- Eliminacion persistente: no existia.
- `showPhoto=false`: la vista publica ocultaba la data URL, pero el dato seguia en DB.
- Exposicion HTML: si `showPhoto=true`, la data URL podia quedar en HTML.
- Riesgo de archivos huerfanos: no aplicaba porque no habia archivos, pero si habia blobs en DB.

## Despues

- Componente de carga: `app/activate/activation-form.tsx`.
- Server Action activacion: `features/activations/actions.ts`.
- Servicio de procesamiento: `server/services/profile-photo-storage.ts`.
- Procesador: `sharp`.
- Formatos aceptados: JPEG, PNG, WebP.
- Rechazados: SVG, GIF, HTML, ejecutables, corruptos y MIME no permitido.
- Limite original: 5 MB.
- Redimensionamiento: maximo 1024 x 1024.
- Conversion: WebP.
- EXIF: `sharp.rotate()` corrige orientacion y la salida WebP no preserva metadata.
- Bucket: `profile-photos`.
- Acceso preferido: privado.
- Ruta:

```text
users/[userId]/profiles/[profileId]/[randomId].webp
```

- Datos DB:
  - `photoStoragePath`
  - `photoMimeType`
  - `photoWidth`
  - `photoHeight`
  - `photoSizeBytes`
  - `photoUpdatedAt`
- `photoUrl`: se limpia y queda `null` para fotos nuevas.
- Exposicion publica: `/api/public/profile-photo/[profileId]`.
- Cache: `private, no-store, max-age=0`.
- Service role: solo servidor, nunca cliente.
- Si Supabase no esta configurado localmente, se usa storage privado local en `data/profile-photos` para desarrollo/test.

## Flujo exacto

1. Navegador selecciona o captura foto.
2. UI valida MIME basico y tamano maximo 5 MB.
3. Activacion envia `photoDataUrl` transitorio.
4. Servidor valida MIME y contenido real.
5. Servidor procesa a WebP maximo 1024 x 1024.
6. Servidor crea perfil.
7. Servidor guarda objeto privado en Supabase Storage o storage local privado.
8. Servidor actualiza metadata en `Profile`.
9. Ficha publica solo recibe URL controlada si `showPhoto=true`.
10. Endpoint valida perfil publico, pulsera activa y `showPhoto=true` antes de entregar bytes.
