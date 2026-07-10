'use client';

import type { OrderFulfillmentState } from '../types/order-fulfillment-state';
import {
  CheckoutLicenseDisplay,
  CheckoutSuccessError,
  CheckoutSuccessLoading,
  CheckoutSuccessMessage,
  CheckoutSuccessPending,
} from './components/checkout-success-sections';

export type CheckoutSuccessViewProps = {
  state: OrderFulfillmentState;
};

export function CheckoutSuccessView({ state }: CheckoutSuccessViewProps) {
  if (state.status === 'loading') {
    return <CheckoutSuccessLoading />;
  }

  if (state.status === 'pending') {
    return <CheckoutSuccessPending message={state.message} />;
  }

  if (state.status === 'error') {
    return (
      <CheckoutSuccessError
        message={state.message}
        signInHref={state.signInHref}
      />
    );
  }

  return (
    <>
      <CheckoutSuccessMessage gameTitle={state.license.game.title} />
      <CheckoutLicenseDisplay license={state.license} />
    </>
  );
}
