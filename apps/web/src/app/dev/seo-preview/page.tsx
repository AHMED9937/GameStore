import { siteConfig } from '@gamestore/shared/seo';
import { Card, Container, Heading, Text } from '@gamestore/shared/ui';

export const metadata = {
  title: 'SEO Preview | GameStore',
  robots: { index: false, follow: false },
};

export default function SeoPreviewPage() {
  return (
    <Container style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Heading level="h1">SEO Preview</Heading>
      <Card style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
        <Text tone="accent" style={{ marginBottom: '1rem' }}>
          SEO — setup complete. Full metadata not implemented yet.
        </Text>
        <Text tone="muted">Site name: {siteConfig.siteName}</Text>
        <Text tone="muted" style={{ marginTop: '0.5rem' }}>
          Site URL: {siteConfig.siteUrl}
        </Text>
        <Text tone="muted" style={{ marginTop: '0.5rem' }}>
          Default OG image: {siteConfig.defaultOgImage}
        </Text>
      </Card>
    </Container>
  );
}
