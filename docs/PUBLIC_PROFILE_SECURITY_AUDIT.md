# Public Profile Security Audit

Fecha: 2026-07-13

Estado: implementacion base lista, pendiente de hardening externo con proveedor de rate limit en produccion.

Controles implementados:

- Proyeccion publica server-side.
- Telefonos ocultos por defecto como texto.
- Telefonos disponibles solo tras accion explicita; no se serializan en el HTML inicial cuando `showPhoneNumbers` esta apagado.
- Campos medicos granulares.
- Mascotas/objetos no exponen campos medicos.
- Ubicacion solo por click.
- Rechazo de ubicacion registrado sin insistir.
- Reporte encontrado sin datos obligatorios.
- Sanitizacion basica de texto visible y payloads.
- Rate limit local en scans y acciones publicas.
- Errores neutrales en RPC Supabase.

Riesgos residuales:

- El rate limit en memoria no comparte estado entre instancias Vercel.
- Las notificaciones son locales/simuladas hasta conectar proveedor real.
- El upload de fotos requiere capa de URLs firmadas en producto.
