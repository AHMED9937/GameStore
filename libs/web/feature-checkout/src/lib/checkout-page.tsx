'use client';

import { useCallback } from 'react';
import { Container, Heading } from '@gamestore/shared/ui';
import type { GameDetail } from '@gamestore/web/data-access';
import { CheckoutAsyncView } from './components/checkout-async-view';
import { CheckoutCancelledBanner } from './components/checkout-cancelled-banner';
import {
  CheckoutPayment,
  CheckoutSummary,
  CheckoutTerms,
} from './components/checkout-sections';
import styles from './components/section.module.css';
import { useCheckoutGame } from './hooks/use-checkout-game';
import type { CheckoutAsyncState } from './types/checkout-async-state';

export type CheckoutPageProps = {
  gameSlug?: string | null;
  cancelled?: boolean;
  gameState?: CheckoutAsyncState<GameDetail>;
};

export function CheckoutPage({
  gameSlug = null,
  cancelled = false,
  gameState: gameStateOverride,
}: CheckoutPageProps) {
  const fetchedState = useCheckoutGame(gameStateOverride ? null : gameSlug);
  const gameState = gameStateOverride ?? fetchedState;

  const handleRetry = useCallback(() => {
    if (gameSlug) {
      window.location.assign(`/checkout?game=${encodeURIComponent(gameSlug)}`);
    }
  }, [gameSlug]);

  return (
    <section className={styles.section}>
      <Container>
        <Heading level="h1">Checkout</Heading>
        {cancelled && gameState.status === 'success' ? (
          <div style={{ marginTop: '1rem' }}>
            <CheckoutCancelledBanner />
          </div>
        ) : null}
        <div className={styles.twoCol} style={{ marginTop: '1.5rem' }}>
          <CheckoutAsyncView
            state={gameState}
            onRetry={gameState.status === 'error' ? handleRetry : undefined}
          >
            {(game) => <CheckoutSummary game={game} />}
          </CheckoutAsyncView>
          <div>
            {gameState.status === 'success' ? (
              <CheckoutPayment game={gameState.data} />
            ) : null}
            <div style={{ marginTop: '1rem' }}>
              <CheckoutTerms />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
