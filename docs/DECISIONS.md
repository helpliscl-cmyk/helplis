# Decisions

- Se usa `Device` como nombre genérico en lugar de `Wristband`.
- No hay branding definitivo: UI neutra con tipografía de sistema.
- SQLite queda solo para desarrollo local.
- Prisma se fija en 6.19.3 por estabilidad del flujo SQLite local en este entorno.
- Se aplica migración SQL generada por Prisma mediante script local idempotente.
- `activationCode` se conoce solo en fabricación/demo; la base guarda hash.
- La ubicación requiere acción explícita del usuario que escanea.
- Las notificaciones son locales y auditables.
