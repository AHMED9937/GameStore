export const ADMIN_LICENSES_SETUP_MESSAGE =
  'Admin licenses — not implemented yet';

export const ADMIN_LICENSE_COLUMNS = [
  { key: 'licenseKey', header: 'License key' },
  { key: 'game', header: 'Game' },
  { key: 'source', header: 'Source' },
  { key: 'owner', header: 'Owner' },
  { key: 'status', header: 'Status' },
  { key: 'expires', header: 'Expires' },
  { key: 'actions', header: 'Actions' },
] as const;
