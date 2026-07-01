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

export const EMPTY_ADMIN_LICENSE_FORM_VALUES: AdminLicenseFormValues = {
  gameId: '',
  quantity: '1',
  buyerEmail: '',
};
