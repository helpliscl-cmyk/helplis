# Public Profile Spec

Fecha: 2026-07-13

La ficha publica `/p/[publicCode]` ayuda a asistir a una persona y contactar a su familia o responsable. No es historia clinica, red social ni ficha comercial.

## Jerarquia

1. Estado de la pulsera.
2. Foto si esta autorizada.
3. Nombre visible si esta autorizado.
4. Mensaje de ayuda.
5. Boton llamar contacto prioritario.
6. Boton WhatsApp contacto prioritario.
7. Contacto secundario debajo.
8. Compartir ubicacion.
9. Reportar encontrado.
10. Informacion importante solo si existe y esta autorizada.

## Informacion importante

La primera version usa un unico campo:

- `criticalInformation`
- `showCriticalInformation`

El titulo publico es `Informacion importante`. El tono debe ser claro, destacado y no alarmista.

No se muestran listas medicas vacias ni campos irrelevantes.

## Privacidad

- Los telefonos no se imprimen en HTML por defecto.
- Llamada y WhatsApp usan endpoint seguro.
- La ubicacion del responsable nunca se muestra.
- La ubicacion del scanner solo se envia tras accion explicita.
- Datos legacy de mascotas, objetos y medicina granular no aparecen en flujos nuevos.
