# Packing workflow

Implemented at `/admin/orders/[orderId]/packing`.

The workflow shows:

- order and customer
- reserved public codes
- batch
- verification state
- activation code
- activation-card link
- packing checklist

Every activation-code reveal writes an audit log. Completion requires all checklist items and moves the order to `READY_TO_SHIP`.
