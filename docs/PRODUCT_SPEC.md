# Product Spec

HelPlis es una plataforma para identificar personas, mascotas, objetos y activos mediante un `publicCode`, URL pública, QR y NFC. El MVP local implementa la activación segura por `publicCode + activationCode`, ficha pública móvil, panel de usuario, panel administrador, organizaciones, campañas, importación de lotes, auditoría, analítica local y notificaciones simuladas.

Tipos soportados: `PERSON`, `CHILD`, `SENIOR`, `DEPENDENT_PERSON`, `MEDICAL_PROFILE`, `PET`, `LUGGAGE`, `OBJECT`, `ASSET`, `EMPLOYEE`, `OTHER`.

Productos soportados: `WRISTBAND`, `PET_TAG`, `KEYCHAIN`, `CARD`, `STICKER`, `LUGGAGE_TAG`, `ASSET_TAG`, `OTHER`.

El MVP no implementa checkout, servicios externos ni app móvil. Todo funciona localmente con SQLite.

## Modelo comercial retail

La fase comercial vigente define HelPlis como compra única, sin mensualidad obligatoria y sin suscripción de compra.

Packs publicados:

- 1 Pulsera HelPlis: $18.000 CLP.
- Pack 2 HelPlis: $28.000 CLP, $14.000 por unidad, ahorro $8.000 frente a comprar dos por separado.
- Pack 3 HelPlis: $35.000 CLP, $11.667 por unidad, ahorro $19.000 frente a comprar tres por separado.

El envío se paga aparte y no se calcula en la web. No se publican costos de envío, cobertura ni plazos mientras no estén confirmados.

Cada pulsera incluye activación y acceso a su perfil digital. La información del perfil puede actualizarse posteriormente sin cambiar la pulsera.

## Funnel de compra

El home dirige a `/quiero-helplis`, donde el visitante selecciona pack, deja datos de contacto y acepta ser contactado. El resultado es una intención o solicitud de compra, no una venta confirmada.

La confirmación ofrece abrir WhatsApp con mensaje prellenado al número oficial `+56 9 8845 5230`.
