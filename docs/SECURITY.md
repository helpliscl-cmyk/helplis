# Security

Controles implementados:

- Hash bcrypt para contraseñas y activation codes.
- Sesión HTTP-only con `iron-session`.
- Protección de rutas dashboard/admin por sesión y roles.
- Mensajes de error neutros en activación y login.
- Conteo de intentos de activationCode y bloqueo temporal después de 5 fallos.
- IP hasheada en escaneos y acciones.
- Ubicación solo con consentimiento explícito.
- Notificaciones mock sin envío real.

Pendiente antes de producción: rate limiting distribuido, CSP estricta, CSRF adicional donde aplique, RLS Supabase, monitoreo externo, backups, rotación de secretos y revisión legal de privacidad.
