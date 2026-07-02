export type SetupResponse = {
  status: 'setup';
  integration: string;
  message: string;
};

export type BulkActionFailure = {
  id: string;
  reason: string;
};

export type BulkActionResult = {
  succeeded: string[];
  failed: BulkActionFailure[];
};
