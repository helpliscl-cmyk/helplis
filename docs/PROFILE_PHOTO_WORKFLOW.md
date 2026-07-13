# Profile Photo Workflow

## Activacion

La etapa visible se llama "Foto y datos de la persona" y muestra:

- Tomar foto.
- Elegir desde galeria.
- Eliminar foto.
- Continuar sin foto.
- Preview local.
- Estado de foto lista o error comprensible.

Texto:

```text
Esta foto puede ayudar a reconocer a la persona cuando alguien escanee su HelPlis.
```

Al confirmar activacion, el servidor procesa y sube la foto antes de activar la pulsera.

## Privacidad

- `showPhoto=true`: la ficha publica puede solicitar `/api/public/profile-photo/[profileId]`.
- `showPhoto=false`: la API publica no devuelve URL utilizable y el HTML no contiene la imagen.
- La cache publica se evita con `private, no-store`.

## Reemplazo

Desde `/dashboard/profiles`:

1. Subir nueva foto.
2. Procesar y guardar objeto nuevo.
3. Actualizar metadata DB.
4. Borrar objeto anterior.
5. Registrar audit log `PROFILE_PHOTO_REPLACED` o `PROFILE_PHOTO_UPLOADED`.

## Eliminacion

Desde `/dashboard/profiles`:

1. Limpiar metadata DB.
2. Poner `showPhoto=false`.
3. Borrar objeto.
4. Registrar audit log `PROFILE_PHOTO_DELETED`.

## Retencion

Al desactivar o borrar perfiles se debe aplicar politica operacional de retencion. Esta fase evita nuevos huerfanos en reemplazo/eliminacion directa, pero no borra evidencia historica automaticamente.
