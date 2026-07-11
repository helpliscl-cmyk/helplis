# Admin Flows

Flujos implementados:

- Login admin con rol `SUPER_ADMIN`, `ADMIN` o `SUPPORT`.
- Crear lote y generar dispositivos.
- Importar CSV con validación de URL, duplicados y UID NFC.
- Exportar lote en CSV.
- Ver dispositivos, usuarios, perfiles, escaneos, notificaciones y auditoría.
- Crear organizaciones y campañas.

El admin no ve activationCode en texto plano. Los exports incluyen publicCode, URL pública, UID NFC, tipo y estado, pero no hashes ni secretos.
