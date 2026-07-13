# Security

Controles implementados:

- Hash bcrypt para passwords y activation codes.
- Sesion HTTP-only con `iron-session`.
- Proteccion de rutas dashboard/admin por sesion y roles.
- Mensajes de error neutros en activacion y login.
- Conteo de intentos de activationCode y bloqueo temporal despues de 5 fallos.
- IP hasheada en escaneos y acciones.
- Ubicacion solo con consentimiento explicito.
- Notificaciones mock sin envio real.

## Device state security

- Pulsera activa no acepta reactivacion publica ni sobrescritura de perfil.
- Administracion de dispositivo valida propietario, rol autorizado o membresia con permisos.
- Intentos ajenos de administracion responden con mensaje neutro y audit log.
- Reasignacion requiere login, permiso, confirmacion explicita y conserva `publicCode`, QR y UID NFC.
- Reasignacion registra usuario, fecha y motivo opcional, sin borrar historial.
- `/api/activation/validate` devuelve solo estado controlado y URLs de accion, sin datos privados.

Pendiente antes de produccion: rate limiting distribuido, CSP estricta, CSRF adicional donde aplique, RLS Supabase, monitoreo externo, backups, rotacion de secretos y revision legal de privacidad.
