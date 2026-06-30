import { Card, Container, Heading, Text } from '@gamestore/shared/ui';

const STATS = [
  { label: 'Published games', value: '—' },
  { label: 'Active licenses', value: '—' },
  { label: 'Pool accounts', value: '—' },
  { label: 'Orders today', value: '—' },
] as const;

export default function AdminDashboardPage() {
  return (
    <Container>
      <Heading level="h2" style={{ marginBottom: '0.5rem' }}>
        Dashboard
      </Heading>
      <Text tone="muted" style={{ marginBottom: '1.5rem' }}>
        Manage catalog, licenses, Steam accounts, and orders. CRUD wiring arrives in
        later security and Phase 7 slices.
      </Text>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {STATS.map(({ label, value }) => (
          <Card key={label} style={{ padding: '1.25rem' }}>
            <Text tone="dim" style={{ fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
              {label}
            </Text>
            <Heading level="h3">{value}</Heading>
          </Card>
        ))}
      </div>

      <Card style={{ padding: '1.25rem' }}>
        <Heading level="h3" style={{ marginBottom: '0.5rem' }}>
          Quick links
        </Heading>
        <Text tone="muted">
          Use the sidebar to open Games, Licenses, Accounts, and Orders. API CRUD is
          already available on Nest — admin UI forms will connect in upcoming slices.
        </Text>
      </Card>
    </Container>
  );
}
