# Activation Flow

Fecha: 2026-07-13

La activacion empieza con la pulsera, no con un formulario largo.

## Entrada

- Accion principal: escanear QR.
- Accion secundaria: leer NFC si Web NFC esta disponible.
- Alternativa: ingresar codigo manualmente.

El sistema extrae `publicCode`, valida disponibilidad y luego solicita datos.

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
