# Found Report Flow

Fecha: 2026-07-13

La accion "Reportar encontrado" abre un formulario opcional:

- Nombre opcional.
- Telefono opcional.
- Mensaje opcional.
- Ubicacion opcional, solo con click separado.

No se exige dato personal. El reporte se guarda en `found_reports`, se registra `FOUND_REPORTED` en `contact_actions` y se crea una notificacion local para el responsable.
