# Supabase RLS

Fecha: 2026-07-13

Roles:

- `USER`: lee y edita sus propios perfiles/contactos/dispositivos.
- `ORGANIZATION_ADMIN`: acceso por membresia institucional.
- `SUPPORT`: lectura y gestion de soporte.
- `OPERATIONS`: produccion, inventario, pedidos, pagos y envios.
- `ADMIN` y `SUPER_ADMIN`: administracion.

Principios:

- Las inserciones publicas se limitan a scan events, location shares, found reports, contact actions, support messages e institution leads.
- El owner lee scans, ubicaciones y reportes de sus dispositivos.
- Operaciones no recibe permisos medicos extra salvo lo necesario por tablas operativas.
- Audit logs son lectura admin.
- Funciones publicas usan respuestas neutrales para evitar enumeracion.
