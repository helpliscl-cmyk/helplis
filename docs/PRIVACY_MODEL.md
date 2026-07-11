# Privacy Model

Cada perfil controla visibilidad de foto, información médica, nombres de contactos, teléfonos, edad, botones de ubicación, WhatsApp, llamada, mensaje y publicación del perfil.

La ficha `/p/[publicCode]` usa una proyección pública: consulta el perfil completo en servidor y devuelve/renderiza solo campos permitidos. La ubicación no se solicita al cargar; el botón muestra el aviso “Tu ubicación solo se enviará si aceptas compartirla” y registra consentimiento al aceptar el permiso del navegador.

El propietario nunca revela su ubicación. La persona que escanea solo comparte voluntariamente su propia ubicación.
