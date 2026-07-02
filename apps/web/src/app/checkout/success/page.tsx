import { Suspense } from 'react';
import { CheckoutSuccessPage } from '@gamestore/web/feature-checkout-success';

type CheckoutSuccessRouteProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function Page({ searchParams }: CheckoutSuccessRouteProps) {
  const params = await searchParams;

  return <CheckoutSuccessPage sessionId={params.session_id ?? null} />;
}
