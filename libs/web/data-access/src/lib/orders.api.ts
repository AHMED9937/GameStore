import { apiGet, apiPost, type ApiAuthOptions } from './api-client';

export type OrderSummary = {
  id: string;
  amount: string;
  currency: string;
  buyerEmail: string | null;
  createdAt: string;
};

export type OrderLicense = {
  licenseKey: string;
  status: string;
  game: { id: string; title: string; slug: string };
};

export type OrderSessionLookup =
  | {
      status: 'completed';
      order: OrderSummary;
      license: OrderLicense;
    }
  | {
      status: 'pending';
      message: string;
    }
  | {
      status: 'failed';
      message: string;
    };

export async function fetchOrderBySession(
  sessionId: string,
  auth?: ApiAuthOptions,
): Promise<OrderSessionLookup> {
  return apiGet<OrderSessionLookup>(
    `/orders/by-session/${encodeURIComponent(sessionId)}`,
    undefined,
    auth,
  );
}

export async function cancelOrderBySession(
  sessionId: string,
): Promise<OrderSessionLookup> {
  return apiPost<OrderSessionLookup>(
    `/orders/by-session/${encodeURIComponent(sessionId)}/cancel`,
    {},
  );
}
