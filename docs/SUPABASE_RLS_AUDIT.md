# Supabase RLS Audit

Fecha: 2026-07-13

Cobertura:

- `profiles`, `contacts`, `devices`: owner/support/org segun tabla.
- `scan_events`, `location_shares`, `found_reports`, `contact_actions`: insert publico controlado, lectura owner/support.
- Operaciones: `OPERATIONS`, `ADMIN`, `SUPER_ADMIN`.
- Soporte: `SUPPORT`, `ADMIN`, `SUPER_ADMIN`.
- `audit_logs`: lectura admin.
- Storage: owner por carpeta.

Checks pendientes en proyecto real:

- Aplicar migraciones en Supabase remoto.
- Probar con usuarios reales por rol.
- Confirmar que anon no puede listar tablas privadas.
- Confirmar que service role se usa solo en backend.
- Confirmar que `profile-photos` no es publico.
