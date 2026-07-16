import {
  buildGameMetadata,
  buildPageMetadata,
  siteConfig,
} from '@gamestore/shared/seo';
import { Card, Container, Heading, Text } from '@gamestore/shared/ui';

export const metadata = {
  title: 'SEO Preview | OfflineGameNIA',
  robots: { index: false, follow: false },
};

const sampleGame = {
  slug: 'demo-game-1',
  title: 'Stellar Odyssey',
  description: 'Explore the stars in this award-winning space RPG.',
  platform: 'steam',
  priceBase: '9.99',
  coverImage: '/og/default.png',
  metaTitle: null,
  metaDescription: null,
  ogImage: null,
  soldOut: false,
};

export default function SeoPreviewPage() {
  const homeMetadata = buildPageMetadata('home');
  const gameMetadata = buildGameMetadata(sampleGame);

  return (
    <Container style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Heading level="h1">SEO Preview</Heading>
      <Card style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
        <Text tone="accent" style={{ marginBottom: '1rem' }}>
          Resolved metadata from shared SEO builders.
        </Text>
        <Text tone="muted">Site name: {siteConfig.siteName}</Text>
        <Text tone="muted" style={{ marginTop: '0.5rem' }}>
          Site URL: {siteConfig.siteUrl}
        </Text>
        <Text tone="muted" style={{ marginTop: '0.5rem' }}>
          Default OG image: {siteConfig.defaultOgImage}
        </Text>
        <Text tone="muted" style={{ marginTop: '1rem' }}>
          Home title: {String(homeMetadata.title)}
        </Text>
        <Text tone="muted" style={{ marginTop: '0.5rem' }}>
          Game title: {String(gameMetadata.title)}
        </Text>
        <Text tone="muted" style={{ marginTop: '0.5rem' }}>
          Game description: {gameMetadata.description}
        </Text>
      </Card>
    </Container>
  );
}
