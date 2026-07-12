# Order fulfillment

Implemented at `/admin/orders`, `/admin/orders/new` and `/admin/orders/[orderId]`.

Prices remain:

- 1 wristband: CLP 18,000
- 2 wristbands: CLP 28,000
- 3 wristbands: CLP 35,000

Leads can be converted from `/admin/leads`; conversion is idempotent through the unique `leadId` on `Order`.

Fulfillment states:

- `NEW`
- `CONFIRMED`
- `AWAITING_STOCK`
- `RESERVED`
- `PACKING`
- `READY_TO_SHIP`
- `SHIPPED`
- `DELIVERED`
- `CANCELLED`
- `RETURNED`
