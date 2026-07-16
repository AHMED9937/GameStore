'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Container, Heading } from '@gamestore/shared/ui';
import { cancelOrderBySession, type GameDetail } from '@gamestore/web/data-access';
import { CheckoutAsyncView } from './components/checkout-async-view';
import { CheckoutCancelledBanner } from './components/checkout-cancelled-banner';
import {
  CheckoutPayment,
  CheckoutSummary,
} from './components/checkout-sections';
import styles from './components/section.module.css';
import { useCheckoutGame } from './hooks/use-checkout-game';
import type { CheckoutAsyncState } from './types/checkout-async-state';

export type CheckoutPageProps = {
  gameSlug?: string | null;
  cancelled?: boolean;
  sessionId?: string | null;
  gameState?: CheckoutAsyncState<GameDetail>;
};

export function CheckoutPage({
  gameSlug = null,
  cancelled = false,
  sessionId = null,
  gameState: gameStateOverride,
}: CheckoutPageProps) {
  const fetchedState = useCheckoutGame(gameStateOverride ? null : gameSlug);
  const gameState = gameStateOverride ?? fetchedState;
  const cancelRequested = useRef(false);

  useEffect(() => {
    if (!cancelled || !sessionId?.trim() || cancelRequested.current) {
      return;
    }

    cancelRequested.current = true;
    void cancelOrderBySession(sessionId.trim()).catch(() => undefined);
  }, [cancelled, sessionId]);

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
          </div>
        </div>
      </Container>
    </section>
  );
}
