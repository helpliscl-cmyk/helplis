# Public Profile Security Audit

Fecha: 2026-07-13

## Controles implementados

- Proyeccion publica server-side.
- Telefonos ocultos por defecto en HTML.
- Llamada y WhatsApp se resuelven por endpoint seguro.
- Ubicacion solo por click con consentimiento.
- Reporte encontrado sin datos obligatorios.
- Errores neutros para codigos invalidos.
- `SUSPENDED` y `DISABLED` no muestran datos personales.
- `ACTIVE` registra escaneo.
- `UNACTIVATED` ofrece activacion sin mostrar perfil.
- `activationCode` nunca aparece en QR/NFC, URL fisica ni export proveedor.

## Fotos

- La ficha publica no recibe rutas privadas.
- Si `showPhoto=false`, `photoUrl` publico es `null` y el HTML no contiene endpoint de foto.
- Si `showPhoto=true`, se usa `/api/public/profile-photo/[profileId]`.
- El endpoint solo entrega bytes si hay pulsera activa asociada.
- Cache deshabilitada para evitar exposicion prolongada tras cambios de privacidad.
- No se exponen bucket, service role ni paths completos.

## Riesgos revisados

- MIME spoofing: servidor valida MIME y contenido real con `sharp`.
- SVG/GIF/HTML: rechazados.
- Path traversal: paths generados por servidor y validados contra raiz local.
- Fotos enormes: limite 5 MB y `limitInputPixels`.
- EXIF: salida WebP sin metadata preservada.
- IDOR por profileId: endpoint exige perfil publico, showPhoto y dispositivo activo.
- Usuarios ajenos: dashboard valida owner para reemplazo/eliminacion.
- URLs antiguas: endpoint no-store y version por `photoUpdatedAt`.

## Riesgos residuales

- Rate limit publico sigue en memoria; conviene mover a proveedor distribuido.
- Supabase runtime real requiere variables en Vercel y verificacion de policies con usuarios reales.
