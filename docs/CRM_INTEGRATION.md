# CRM Integration

No hay CRM conectado. Estados comerciales sugeridos:

`NEW`, `CONTACTED`, `QUALIFIED`, `MEETING`, `PROPOSAL`, `PILOT`, `NEGOTIATION`, `WON`, `LOST`, `FOLLOW_UP`.

Entidades futuras:

- Lead institucional.
- Organización.
- Contacto.
- Reunión.
- Piloto.
- Convenio.
- Campaña.
- Comisión.
- Renovación.

API futura: `POST /api/admin/crm/leads/import` y `POST /api/admin/crm/organizations/import`, protegidas por rol admin y validadas con Zod.
