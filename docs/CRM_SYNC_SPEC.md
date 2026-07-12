# CRM sync spec

No external CRM was modified.

Future integration options:

- secure API pull from HelPlis
- scheduled export
- webhook per event
- idempotent sync by stable IDs

Payload groups:

- retail leads
- institution leads
- orders
- statuses
- notes
- source
- timestamps

Security requirements:

- signed webhooks or OAuth/API key
- idempotency key
- retry policy
- error dead-letter queue
- audit log per sync attempt
