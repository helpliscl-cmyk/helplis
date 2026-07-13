# Privacy Model

Cada perfil controla que datos se muestran en la ficha publica. La regla base es minimizacion: mostrar solo lo necesario para ayudar al reencuentro o asistencia inmediata.

## Valores por defecto

- `showPhoto`: true
- `showFullName`: false
- `showAlias`: true
- `showApproximateAge`: false
- `showBloodType`: false
- `showAllergies`: false
- `showMedicalConditions`: false
- `showMedications`: false
- `showMedicalInstructions`: false
- `showCommunicationNotes`: false
- `showMobilityNotes`: false
- `showSensoryNotes`: false
- `showGeneralArea`: false
- `showExactAddress`: false
- `showContactNames`: true
- `showPhoneNumbers`: false
- `allowCall`: true
- `allowWhatsApp`: true
- `allowMessage`: true
- `allowLocationSharing`: true
- `allowFoundReport`: true

## Datos no requeridos

HelPlis no debe pedir RUT por defecto, no debe exigir fecha completa de nacimiento y no debe mostrar direccion exacta por defecto. La direccion exacta solo puede mostrarse si `showExactAddress` esta habilitado explicitamente.

## Proyeccion publica

La ficha `/p/[publicCode]` consulta el perfil completo en servidor y construye una proyeccion publica. La UI no decide privacidad con datos crudos: recibe solo campos autorizados y acciones permitidas.

El texto de cierre debe indicar: "Solo se muestra informacion autorizada por el responsable de este HelPlis."

## Ubicacion

La ubicacion no se solicita al cargar. El boton "Compartir mi ubicacion" explica antes del permiso que la persona que escanea compartira su ubicacion actual con el responsable.

Si acepta, se guarda latitud, longitud, precision, fecha, consentimiento, dispositivo, scan event, notificacion y resultado. Si rechaza, se registra solo el rechazo sin insistir.

El propietario nunca revela su ubicacion. La persona que escanea solo comparte voluntariamente su propia ubicacion.
