import { Card, Container, Heading, Text } from '@gamestore/shared/ui';

type AdminSectionPageProps = {
  title: string;
  description: string;
};

function AdminSectionPage({ title, description }: AdminSectionPageProps) {
  return (
    <Container>
      <Heading level="h2" style={{ marginBottom: '0.5rem' }}>
        {title}
      </Heading>
      <Text tone="muted" style={{ marginBottom: '1.5rem' }}>
        {description}
      </Text>
      <Card style={{ padding: '1.25rem' }}>
        <Text tone="dim">
          Admin forms and tables for this section will be implemented in upcoming
          slices. The Nest API endpoints are already available for manual testing.
        </Text>
      </Card>
    </Container>
  );
}

export default function AdminGamesPage() {
  return (
    <AdminSectionPage
      title="Games"
      description="Create, edit, and publish catalog titles."
    />
  );
}
