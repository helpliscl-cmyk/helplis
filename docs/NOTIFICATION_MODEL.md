# Notification Model

`NotificationProvider` define métodos conceptuales para email, SMS, WhatsApp, push, webhook y local. `LocalNotificationProvider` persiste eventos en `NotificationEvent` y los muestra en `/admin/notifications`.

Eventos soportados incluyen escaneo, ubicación compartida, clics de contacto, mensaje, encontrado, emergencia, activación completada, perfil actualizado, perdido, suspendido y reactivado.

No se envían mensajes reales en el MVP.
