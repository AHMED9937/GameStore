import { Container, Skeleton } from '@gamestore/shared/ui';

export default function Loading() {
  return (
    <Container style={{ padding: '2rem 0' }} data-testid="my-games-loading">
      <Skeleton width="40%" height={36} rounded="sm" style={{ marginBottom: '1.5rem' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Skeleton width="100%" height={96} rounded="lg" />
        <Skeleton width="100%" height={96} rounded="lg" />
        <Skeleton width="100%" height={96} rounded="lg" />
      </div>
    </Container>
  );
}
