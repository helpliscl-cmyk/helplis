# Product Spec

HelPlis es una plataforma para identificar personas, mascotas, objetos y activos mediante un `publicCode`, URL pública, QR y NFC. El MVP local implementa la activación segura por `publicCode + activationCode`, ficha pública móvil, panel de usuario, panel administrador, organizaciones, campañas, importación de lotes, auditoría, analítica local y notificaciones simuladas.

Tipos soportados: `PERSON`, `CHILD`, `SENIOR`, `DEPENDENT_PERSON`, `MEDICAL_PROFILE`, `PET`, `LUGGAGE`, `OBJECT`, `ASSET`, `EMPLOYEE`, `OTHER`.

Productos soportados: `WRISTBAND`, `PET_TAG`, `KEYCHAIN`, `CARD`, `STICKER`, `LUGGAGE_TAG`, `ASSET_TAG`, `OTHER`.

El MVP no implementa pagos, branding definitivo, servicios externos ni app móvil. Todo funciona localmente con SQLite.
