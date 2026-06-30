import { Card, Container, Heading, Text } from '@gamestore/shared/ui';

export default function AdminLicensesPage() {
  return (
    <Container>
      <Heading level="h2" style={{ marginBottom: '0.5rem' }}>
        Licenses
      </Heading>
      <Text tone="muted" style={{ marginBottom: '1.5rem' }}>
        Issue keys, revoke access, and inspect ownership.
      </Text>
      <Card style={{ padding: '1.25rem' }}>
        <Text tone="dim">
          License management UI connects to POST /api/licenses and revoke endpoints.
        </Text>
      </Card>
    </Container>
  );
}
