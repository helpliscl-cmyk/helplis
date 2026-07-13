# Activation Flow

Fecha: 2026-07-13

La activacion empieza con la pulsera, no con un formulario largo.

## Entrada

- Accion principal: escanear QR.
- Accion secundaria: leer NFC si Web NFC esta disponible.
- Alternativa: ingresar codigo manualmente.

El sistema extrae `publicCode`, valida disponibilidad y luego solicita datos.

## Estados de activacion

El estado publico se normaliza a cuatro valores:

- `UNACTIVATED`: QR/NFC abre activacion y permite continuar tras validar dispositivo.
- `ACTIVE`: QR/NFC abre la ficha publica de ayuda. Intentar activar manualmente muestra "Esta HelPlis ya está activada.", con acciones para ver perfil o administrar.
- `SUSPENDED`: muestra pantalla neutra temporal, sin datos personales, con soporte.
- `DISABLED`: muestra pantalla neutra, sin datos personales.

El flujo publico nunca reactiva, sobrescribe perfil ni cambia responsable.

## Datos

- Responsable: nombre, correo, telefono, contrasena, terminos y autorizacion.
- Persona: foto opcional recomendada, nombre visible, edad opcional, mensaje de ayuda.
- Contactos: exactamente dos.
- Informacion critica: un unico campo libre opcional.
- Privacidad: opciones simples.

## Telefonos

La UI muestra `+569` fijo y el usuario completa ocho digitos. Se guarda `+569XXXXXXXX`.

## Foto

El flujo permite camara, galeria, preview, reemplazo y borrado. La foto es opcional pero recomendada.

## Reasignacion autenticada

La reasignacion vive en dashboard, requiere permiso sobre la HelPlis y confirmacion explicita. Cambia el perfil vinculado a la ficha publica, conserva historial/auditoria y no modifica `publicCode`, QR ni UID NFC.
