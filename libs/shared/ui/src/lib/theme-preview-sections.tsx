import { colorTokenNames, cssVarMap } from '@gamestore/shared/theme';
import { Badge } from './badge';
import { Button } from './button';
import { Card } from './card';
import { Container } from './container';
import { Heading } from './heading';
import { Input } from './input';
import { Stack } from './stack';
import { Text } from './text';
import styles from './ui.module.css';

const surfaceSwatches = [
  { name: 'bg-darker', var: '--bg-darker' },
  { name: 'bg-dark', var: '--bg-dark' },
  { name: 'bg-card', var: '--bg-card' },
  { name: 'bg-input', var: '--bg-input' },
];

function Swatch({ name, cssVar }: { name: string; cssVar: string }) {
  return (
    <div>
      <div className={styles.swatch} style={{ background: `var(${cssVar})` }} />
      <div className={styles.swatchLabel}>{name}</div>
    </div>
  );
}

export function ThemePreviewShowcase() {
  return (
    <Container style={{ paddingTop: '3rem', paddingBottom: '4rem' }}>
      <Stack gap="lg">
        <header>
          <Heading level="h1" gradient>
            Theme Preview
          </Heading>
          <Text tone="muted">
            GameStore design system Amethyst &amp; Aqua Neon (from mockup)
          </Text>
        </header>

        <section className={styles.previewSection}>
          <Heading level="h2" className={styles.previewSectionTitle}>
            Colors
          </Heading>
          <Stack gap="md">
            <Text tone="dim">Semantic tokens</Text>
            <div className={styles.swatchGrid}>
              {colorTokenNames.map((token) => (
                <Swatch key={token} name={token} cssVar={token} />
              ))}
            </div>
            <Text tone="dim">Surfaces</Text>
            <div className={styles.swatchGrid}>
              {surfaceSwatches.map((s) => (
                <Swatch key={s.var} name={s.name} cssVar={s.var} />
              ))}
            </div>
          </Stack>
        </section>

        <section className={styles.previewSection}>
          <Heading level="h2" className={styles.previewSectionTitle}>
            Typography
          </Heading>
          <Stack gap="md">
            <Heading level="h1" gradient>
              Hero Display 56px
            </Heading>
            <Heading level="h2">Section Title Space Grotesk</Heading>
            <Heading level="h3">Card Title 24px</Heading>
            <Text>Body text Plus Jakarta Sans, comfortable reading line.</Text>
            <Text tone="muted">Muted supporting copy for descriptions.</Text>
            <Text tone="accent">Accent label OFFLINE READY</Text>
          </Stack>
        </section>

        <section className={styles.previewSection}>
          <Heading level="h2" className={styles.previewSectionTitle}>
            Buttons
          </Heading>
          <Stack direction="row" gap="md">
            <Button variant="primary">Browse Games</Button>
            <Button variant="secondary">Activate Key</Button>
            <Button variant="ghost">View Plans</Button>
          </Stack>
        </section>

        <section className={styles.previewSection}>
          <Heading level="h2" className={styles.previewSectionTitle}>
            Cards &amp; glass
          </Heading>
          <Stack direction="row" gap="md">
            <Card hover style={{ padding: '1.5rem', flex: 1, minWidth: 200 }}>
              <Badge variant="accent">Steam</Badge>
              <Heading level="h3" style={{ marginTop: '1rem' }}>
                Glass panel
              </Heading>
              <Text tone="muted">Hover for lift + glow border.</Text>
            </Card>
            <Card style={{ padding: '1.5rem', flex: 1, minWidth: 200 }}>
              <Badge variant="success">In stock</Badge>
              <Heading level="h3" style={{ marginTop: '1rem' }}>
                Static card
              </Heading>
              <Text tone="dim">Default glass surface.</Text>
            </Card>
          </Stack>
        </section>

        <section className={styles.previewSection}>
          <Heading level="h2" className={styles.previewSectionTitle}>
            Form controls
          </Heading>
          <Stack gap="md" style={{ maxWidth: 360 }}>
            <Input placeholder="Search games…" aria-label="Search games" />
            <Stack direction="row" gap="sm">
              <Badge>Steam</Badge>
              <Badge variant="accent">Epic</Badge>
              <Badge variant="success">Available</Badge>
            </Stack>
          </Stack>
        </section>

        <section className={styles.previewSection}>
          <Heading level="h2" className={styles.previewSectionTitle}>
            Radius &amp; spacing
          </Heading>
          <div className={styles.tokenGrid}>
            {(['sm', 'md', 'lg', 'xl'] as const).map((r) => (
              <div key={r}>
                <div
                  className={styles.radiusSample}
                  style={{ borderRadius: `var(--radius-${r})` }}
                />
                <div className={styles.swatchLabel}>radius-{r}</div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.previewSection}>
          <Heading level="h2" className={styles.previewSectionTitle}>
            CSS variables
          </Heading>
          <Card style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>
            <pre style={{ margin: 0, color: 'var(--text-muted)', overflow: 'auto' }}>
              {JSON.stringify(cssVarMap, null, 2)}
            </pre>
          </Card>
        </section>
      </Stack>
    </Container>
  );
}
