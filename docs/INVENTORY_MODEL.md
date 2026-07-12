# Inventory model

Implemented at `/admin/inventory` and `/admin/inventory/[deviceId]`.

Core states:

- `IN_PRODUCTION`
- `IN_TRANSIT`
- `RECEIVED`
- `PENDING_VERIFICATION`
- `VERIFIED`
- `AVAILABLE`
- `RESERVED`
- `SOLD`
- `PACKING`
- `SHIPPED`
- `DELIVERED`
- `ACTIVATED`
- `RETURNED`
- `DAMAGED`
- `LOST`

Inventory supports search by public code, UID, batch, order and status. Physical location is optional through warehouse/shelf/box/position.
