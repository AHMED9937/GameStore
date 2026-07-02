import type { OrderLicense, OrderSummary } from '@gamestore/web/data-access';

export type OrderFulfillmentState =
  | { status: 'loading' }
  | { status: 'pending'; message: string }
  | {
      status: 'success';
      order: OrderSummary;
      license: OrderLicense;
    }
  | { status: 'error'; message: string };
