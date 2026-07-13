# Public Profile Spec

Fecha: 2026-07-13

La ficha publica `/p/[publicCode]` es una vista de ayuda para la persona que escanea un HelPlis. Debe ser breve, clara y accionable. No es una historia clinica completa, no es una red social y no debe revelar datos privados por defecto.

## Objetivo

Responder en menos de una pantalla:

1. Quien o que fue encontrado.
2. Si necesita ayuda o esta en modo perdido.
3. Que accion conviene tomar ahora.
4. A que contactos avisar.
5. Que informacion critica autorizada debe conocer quien ayuda.
6. Si puede compartir voluntariamente su ubicacion.

## Tipos de perfil

Tipos publicos soportados:

- `CHILD`
- `PERSON`
- `SENIOR`
- `DEPENDENT_PERSON`
- `MEDICAL_PROFILE`
- `PET`
- `LUGGAGE`
- `OBJECT`
- `ASSET`
- `OTHER`

`EMPLOYEE` puede mantenerse como valor legado/interno mientras exista en datos anteriores, pero no debe ser el tipo recomendado en activacion publica.

## Jerarquia visual

1. Estado: activo, perdido, encontrado o no disponible.
2. Foto si esta autorizada.
3. Nombre visible: alias o nombre corto segun privacidad.
4. Tipo de perfil en lenguaje humano.
5. Mensaje principal editable.
6. Acciones rapidas: llamar, WhatsApp, mensaje, compartir ubicacion, reportar encontrado.
7. Informacion critica autorizada: alergias, condiciones, medicamentos, instrucciones, comunicacion, movilidad y sensorial.
8. Contactos por prioridad.
9. Informacion adicional: edad aproximada, comuna/sector, datos veterinarios, descripcion de objeto, recompensa o instrucciones de devolucion.
10. Texto de privacidad.

## Campos por familia

Campos generales:

- `displayName`
- `alias`
- `photoUrl`
- `headline`
- `helpMessage`
- `description`
- `preferredLanguage`
- `statusMessage`
- `isPublic`

Campos persona:

- `firstName`
- `lastName`
- `approximateAge`
- `birthYear`
- `genderOptional`
- `communicationNotes`
- `mobilityNotes`
- `sensoryNotes`
- `cognitiveNotes`

Campos medicos opcionales:

- `bloodType`
- `allergies`
- `medicalConditions`
- `medications`
- `medicalInstructions`
- `emergencyInstructions`
- `organDonorOptional`
- `healthProviderOptional`

Campos ubicacion/residencia:

- `country`
- `region`
- `commune`
- `generalArea`
- `exactAddress`
- `showGeneralArea`
- `showExactAddress`

Campos mascotas:

- `petName`
- `species`
- `breed`
- `color`
- `sex`
- `sterilizedOptional`
- `veterinaryNotes`
- `microchipNumberOptional`
- `rewardMessage`
- `petBehaviorNotes`

Campos objetos:

- `objectName`
- `objectCategory`
- `brand`
- `model`
- `color`
- `description`
- `rewardMessage`
- `returnInstructions`

## Plantillas de ayuda

Las plantillas son editables y no alarmistas:

- Nino: "Estoy con una pulsera HelPlis. Por favor contacta a mi adulto responsable y acompaname en un lugar seguro."
- Adulto mayor: "Puedo necesitar orientacion. Por favor hablame con calma y contacta a mi responsable."
- Persona dependiente: "Puedo requerir apoyo para comunicarme o desplazarme. Revisa las indicaciones autorizadas y contacta a mi red."
- Mascota: "Soy una mascota con identificacion HelPlis. Por favor avisa a mi tutor antes de trasladarme."
- Objeto: "Este objeto tiene identificacion HelPlis. Por favor avisa al responsable para coordinar la devolucion."

## Acciones

Compartir ubicacion:

- Nunca se solicita al cargar.
- Antes del permiso muestra una explicacion breve.
- Si acepta, guarda latitud, longitud, precision, fecha, consentimiento, dispositivo, scan event, notificacion y resultado.
- Si rechaza, registra solo el rechazo sin insistir.
- Nunca muestra la ubicacion del propietario.

Lo encontre:

- Permite mensaje, nombre, telefono y ubicacion opcionales.
- No exige datos personales.
- Confirma que el aviso fue registrado y notifica al responsable.

Emergencia:

- Es una accion secundaria.
- Muestra aviso de que HelPlis no reemplaza servicios oficiales ni garantiza respuesta inmediata.

## Validaciones

- Telefonos en formato internacional o normalizable.
- Limites de longitud por campo.
- Sanitizacion de texto y rechazo de HTML/scripts.
- Rechazo de URLs peligrosas.
- WhatsApp solo con telefonos normalizados.
- Rate limit por IP/scan/publicCode para acciones publicas.
- Errores neutrales para evitar enumeracion.
