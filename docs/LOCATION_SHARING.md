# Location Sharing

Fecha: 2026-07-13

Reglas:

- Nunca se pide ubicacion al cargar la ficha.
- Solo se pide despues de pulsar "Compartir mi ubicacion" o "Agregar mi ubicacion" en reporte encontrado.
- Si acepta, se guarda latitud, longitud, precision, consentimiento, scan event, dispositivo y fecha.
- Si rechaza, se registra `LOCATION_REJECTED` sin insistir.
- La ubicacion del responsable nunca se muestra.

Tablas:

- `scan_events`: resumen del escaneo.
- `location_shares`: evento de ubicacion aceptada/rechazada.
- `contact_actions`: auditoria de accion publica.
