export type CreateCheckoutTransactionInput = {
  gameId: string;
  gameSlug: string;
  title: string;
  description?: string | null;
  productId?: string | null;
  priceBase: number;
  coverImage?: string | null;
  userId?: string;
  customerEmail?: string;
};

export type CreateCheckoutTransactionResult = {
  transactionId: string;
  url: string;
};

export type CreateSubscriptionCheckoutTransactionInput = {
  planId: string;
  planSlug: string;
  planName: string;
  providerPriceId: string;
  userId: string;
  customerEmail?: string;
};
