import { Skeleton } from '@gamestore/shared/ui';

export default function Loading() {
  return (
    <div data-testid="admin-loading" aria-busy="true" aria-label="Loading admin content">
      <Skeleton width="35%" height={32} rounded="sm" style={{ marginBottom: '1.5rem' }} />
      <Skeleton width="100%" height={48} rounded="md" style={{ marginBottom: '1rem' }} />
      <Skeleton width="100%" height={280} rounded="lg" />
    </div>
  );
}
