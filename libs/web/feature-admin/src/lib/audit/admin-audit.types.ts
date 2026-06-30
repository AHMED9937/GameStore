export type AdminAuditLogItem = {
  id: string;
  createdAt: string;
  actorEmail: string;
  action: string;
  resource: string;
};
