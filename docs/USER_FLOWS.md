# User Flows

Fecha: 2026-07-13

## Flujos implementados

1. Registro local: `/register`.
2. Login local: `/login`.
3. Activacion por escaneo: `/activate` o `/activate/[publicCode]`.
4. Dashboard: resumen, dispositivos, perfiles, contactos, escaneos, ubicaciones, privacidad, cuenta y soporte.
5. Marcar dispositivo como perdido, encontrado o reactivado.
6. Ficha publica: `/p/[publicCode]`.

## Activacion people-first

1. Escanear QR o leer NFC de la pulsera.
2. Si no se puede escanear, usar ingreso manual secundario.
3. Validar `publicCode` sin exponer `activationCode`.
4. Pedir datos del responsable: nombre, correo, telefono `+569XXXXXXXX`, contrasena, terminos y autorizacion.
5. Pedir datos de la persona: foto opcional recomendada, nombre visible, edad opcional y mensaje de ayuda.
6. Pedir contacto prioritario, con Mama preseleccionada.
7. Pedir contacto secundario, con Papa preseleccionado.
8. Permitir informacion critica opcional en un solo campo.
9. Configurar privacidad simple.
10. Mostrar vista previa.
11. Confirmar activacion.

## Ficha publica

1. La persona escanea QR o NFC.
2. HelPlis registra scan event sin pedir ubicacion al cargar.
3. La ficha muestra foto, nombre visible, mensaje de ayuda y acciones.
4. Llamada y WhatsApp se resuelven por endpoint seguro.
5. La ubicacion del scanner solo se envia si acepta compartirla.
6. La informacion critica aparece solo si existe y `showCriticalInformation = true`.

## Estados al escanear

- `UNACTIVATED`: redirige a activacion con `publicCode` precargado.
- `ACTIVE`: muestra ficha publica, registra escaneo y respeta privacidad.
- `SUSPENDED`: muestra pantalla neutra temporal, sin datos personales, con soporte.
- `DISABLED`: muestra pantalla neutra, sin datos personales.
- `REASSIGNED`: muestra el perfil nuevo vinculado al mismo `publicCode`.

## Administracion y reasignacion

1. "Administrar HelPlis" exige login.
2. El servidor valida propietario, rol admin/soporte o membresia autorizada.
3. Un usuario ajeno ve un mensaje neutro y se registra auditoria.
4. "Asignar a otra persona" permite seleccionar perfil existente o crear uno nuevo.
5. `publicCode`, QR, UID NFC, escaneos y auditoria se conservan.
