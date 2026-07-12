# Payment integration

Implemented now:

- `PaymentProvider` interface
- `ManualPaymentProvider`
- manual transfer/cash/other registration in order detail

No real payment provider is connected.

Preliminary Chile comparison:

- Webpay: broad trust and cards, requires commerce setup and webhook reconciliation.
- Mercado Pago: quick links and wallet/card reach, commercial fees and redirect UX.
- Flow: Chile-friendly payment links and APIs, useful for transfers/cards.
- Manual transfer: lowest integration effort, highest operations burden.

Decision pending: choose provider after validating expected volume, fees, settlement time and support workload.
