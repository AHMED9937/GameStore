export type CreateCheckoutSessionInput = {
  gameId: string;
  gameSlug: string;
  title: string;
  priceBase: number;
  coverImage?: string | null;
  userId?: string;
  customerEmail?: string;
};

export type CreateCheckoutSessionResult = {
  sessionId: string;
  url: string;
};
