import Link from 'next/link';
import { Card, Container, Text } from '@gamestore/shared/ui';
import styles from './section.module.css';

export type SignInPromptProps = {
  message?: string;
  returnPath?: string;
};

export function SignInPrompt({
  message = 'Sign in to access your Steam account credentials.',
  returnPath = '/my-games',
}: SignInPromptProps) {
  const signInHref = `/sign-in?redirect_url=${encodeURIComponent(returnPath)}`;

  return (
    <section className={styles.sectionTight}>
      <Container>
        <Card className={styles.panel} data-testid="my-games-sign-in-prompt">
          <Text tone="muted">{message}</Text>
          <Link href={signInHref} className={styles.signInLink}>
            Sign in
          </Link>
        </Card>
      </Container>
    </section>
  );
}
