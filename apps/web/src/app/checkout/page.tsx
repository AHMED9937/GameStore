import { ApiError, apiErrorMessage, getGameBySlug, type GameDetail } from '@gamestore/web/data-access';
import { CheckoutPage, type CheckoutAsyncState } from '@gamestore/web/feature-checkout';

type CheckoutRouteProps = {
  searchParams: Promise<{ game?: string; cancelled?: string; session_id?: string }>;
};

async function resolveGameState(
  gameSlug: string | null,
): Promise<CheckoutAsyncState<GameDetail> | undefined> {
  if (!gameSlug?.trim()) {
    return undefined;
  }

  try {
    const game = await getGameBySlug(gameSlug.trim());
    if (game.soldOut) {
      return {
        status: 'error',
        message: 'This game is currently sold out.',
      };
    }
    return { status: 'success', data: game };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return {
        status: 'error',
        message: 'This game could not be found.',
      };
    }
    return {
      status: 'error',
      message: apiErrorMessage(error, 'Could not reach the server. Try again.'),
    };
  }
}

export default async function Page({ searchParams }: CheckoutRouteProps) {
  const params = await searchParams;
  const gameSlug = params.game ?? null;
  const gameState = await resolveGameState(gameSlug);

  return (
    <CheckoutPage
      gameSlug={gameSlug}
      cancelled={params.cancelled === '1'}
      sessionId={params.session_id ?? null}
      gameState={gameState}
    />
  );
}
