# Product Spec

Fecha: 2026-07-13

HelPlis es una plataforma para identificar personas mediante pulseras con `publicCode`, URL publica, QR y NFC.

La primera version comercial esta orientada exclusivamente a personas:

- ninos;
- adultos mayores;
- personas que pueden requerir asistencia;
- personas con dificultad para comunicarse;
- personas con necesidades de apoyo.

La arquitectura conserva campos futuros para mascotas, objetos, equipaje y activos, pero esos casos no aparecen en los flujos publicos ni comerciales actuales.

## Tipos visibles

- `CHILD`
- `SENIOR`
- `DEPENDENT_PERSON`
- `MEDICAL_PROFILE`
- `PERSON`

## Activacion

La activacion comienza escaneando la pulsera. El ingreso manual existe solo como alternativa secundaria.

Orden vigente:

1. Escanear HelPlis.
2. Datos del responsable.
3. Foto y datos de la persona.
4. Contacto prioritario.
5. Contacto secundario.
6. Informacion critica opcional.
7. Privacidad.
8. Vista previa.
9. Activacion completada.

El `activationCode` sigue protegido y se solicita despues de identificar la pulsera.

## Modelo comercial retail

La fase comercial vigente define HelPlis como compra unica, sin mensualidad obligatoria y sin suscripcion de compra.

Packs publicados:

- 1 Pulsera HelPlis: $18.000 CLP.
- Pack 2 HelPlis: $28.000 CLP.
- Pack 3 HelPlis: $35.000 CLP.

No modificar precios sin decision comercial explicita.

## Funnel de compra

El home dirige a `/quiero-helplis`, donde el visitante selecciona pack, deja datos de contacto y acepta ser contactado. El resultado es una intencion o solicitud de compra, no una venta confirmada.

Los usos comerciales visibles son solo para personas e instituciones.
