export type AdminGameListItem = {
  id: string;
  title: string;
  slug: string;
  platform: string;
  published: boolean;
};

export type AdminGameFormValues = {
  title: string;
  slug: string;
  platform: string;
  description: string;
  priceBase: string;
};
