export type AdminLicenseListItem = {
  id: string;
  licenseKeyMasked: string;
  gameTitle: string;
  ownerEmail: string | null;
  status: string;
};

export type AdminLicenseFormValues = {
  gameId: string;
  quantity: string;
  buyerEmail: string;
};
