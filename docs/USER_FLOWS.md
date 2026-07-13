# User Flows

## Flujos implementados

1. Registro local: `/register`.
2. Login local: `/login`.
3. Activacion: `/activate` o `/activate/[publicCode]`, con publicCode, activationCode, usuario, perfil, contacto y privacidad inicial.
4. Dashboard: resumen, dispositivos, perfiles, contactos, escaneos, ubicaciones, privacidad, cuenta y soporte.
5. Marcar dispositivo como perdido, encontrado o reactivado.
6. Revisar ficha publica desde dashboard.

## Flujo objetivo de activacion asistida

1. Elegir tipo de perfil: persona, nino, adulto mayor, persona dependiente, perfil medico, mascota, equipaje, objeto, activo u otro.
2. Definir nombre visible o alias.
3. Agregar foto opcional.
4. Elegir o editar mensaje de ayuda segun tipo.
5. Agregar contactos de emergencia, minimo uno y capacidad para tres o mas.
6. Agregar informacion critica opcional. La informacion medica solo aparece para perfiles de persona.
7. Ajustar privacidad con valores seguros por defecto.
8. Revisar vista previa exacta: normal, modo perdido, maxima privacidad y personalizada.
9. Confirmar activacion.

## Flujo publico de escaneo

1. La persona escanea QR o NFC.
2. HelPlis registra un scan event con metadatos tecnicos y sin pedir ubicacion.
3. Se muestra la ficha autorizada con estado, nombre visible, mensaje principal y acciones.
4. La persona puede llamar, abrir WhatsApp, enviar mensaje, compartir su ubicacion o reportar que encontro el dispositivo.
5. Si comparte ubicacion, el navegador pide permiso solo despues del click.
6. Si reporta encontrado, puede dejar mensaje y contacto opcional.
7. El responsable recibe eventos locales/notificaciones segun configuracion.

## Flujo de modo perdido

1. El responsable marca el dispositivo como perdido.
2. La ficha publica resalta el mensaje de perdido.
3. Se priorizan contactos, instrucciones de retorno, recompensa opcional y boton de ubicacion voluntaria.
4. No se muestran datos adicionales fuera de la privacidad configurada.

## Flujo de emergencia

1. La accion "Emergencia" es secundaria.
2. La UI explica que HelPlis no es un servicio medico ni reemplaza servicios oficiales.
3. Se registra el evento para auditoria y posible notificacion al responsable.
