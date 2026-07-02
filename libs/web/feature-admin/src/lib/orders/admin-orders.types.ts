export type AdminOrderListItem = {
  id: string;
  status: string;
  orderType: string;
  amount: string;
  currency: string;
  buyerEmail: string | null;
  ownerEmail: string | null;
  gameTitle: string;
  gameSlug: string;
  licenseKeyMasked: string | null;
  licenseSource: string | null;
  createdAt: string;
};
