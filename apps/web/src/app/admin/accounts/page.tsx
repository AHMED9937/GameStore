import { Card, Container, Heading, Text } from '@gamestore/shared/ui';

export default function AdminAccountsPage() {
  return (
    <Container>
      <Heading level="h2" style={{ marginBottom: '0.5rem' }}>
        Steam accounts
      </Heading>
      <Text tone="muted" style={{ marginBottom: '1.5rem' }}>
        Manage the shared account pool (credentials never shown in list views).
      </Text>
      <Card style={{ padding: '1.25rem' }}>
        <Text tone="dim">
          Account pool UI will wrap /api/game-accounts CRUD with admin-only access.
        </Text>
      </Card>
    </Container>
  );
}
