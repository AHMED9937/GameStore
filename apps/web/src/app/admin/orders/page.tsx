import { Card, Container, Heading, Text } from '@gamestore/shared/ui';

export default function AdminOrdersPage() {
  return (
    <Container>
      <Heading level="h2" style={{ marginBottom: '0.5rem' }}>
        Orders
      </Heading>
      <Text tone="muted" style={{ marginBottom: '1.5rem' }}>
        Review purchases and fulfillment status.
      </Text>
      <Card style={{ padding: '1.25rem' }}>
        <Text tone="dim">
          Order listing arrives with Phase 7 (Stripe). This page is ready for that
          integration.
        </Text>
      </Card>
    </Container>
  );
}
