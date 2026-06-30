export const ADMIN_AUDIT_SETUP_MESSAGE = 'Admin audit log — not implemented yet';

export const ADMIN_AUDIT_COLUMNS = [
  { key: 'time', header: 'Time' },
  { key: 'actor', header: 'Actor' },
  { key: 'action', header: 'Action' },
  { key: 'resource', header: 'Resource' },
] as const;
