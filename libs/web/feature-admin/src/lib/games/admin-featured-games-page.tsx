'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button, Container, Text } from '@gamestore/shared/ui';
import {
  getAdminFeaturedGames,
  getGameCardCover,
  isSetupResponse,
  updateAdminFeaturedGames,
  type AdminFeaturedGameItem,
  type AdminFeaturedGamesResponse,
} from '@gamestore/web/data-access';
import { AdminAsyncView } from '../components/admin-async-view';
import { AdminPageHeader } from '../components/admin-page-header';
import { AdminPageShell } from '../components/admin-page-shell';
import { useAdminMutation } from '../hooks/use-admin-mutation';
import { useAdminResourceState } from '../hooks/use-admin-resource';
import type { AdminAsyncState } from '../types/admin-async-state';
import styles from './games.module.css';

const MAX_FEATURED = 5;

function parseFeaturedData(data: unknown): AdminFeaturedGamesResponse {
  if (!data || typeof data !== 'object') {
    return { featured: [], available: [] };
  }
  const record = data as AdminFeaturedGamesResponse;
  return {
    featured: Array.isArray(record.featured) ? record.featured : [],
    available: Array.isArray(record.available) ? record.available : [],
  };
}

export type AdminFeaturedGamesPageProps = {
  resourceState?: AdminAsyncState<AdminFeaturedGamesResponse>;
};

function FeaturedGameRow({
  game,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  game: AdminFeaturedGameItem;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const coverSrc = getGameCardCover(game);

  return (
    <li className={styles.featuredRow}>
      <span className={styles.featuredSlot}>{index + 1}</span>
      <img src={coverSrc} alt="" className={styles.featuredThumb} />
      <div className={styles.featuredMeta}>
        <Text>{game.title}</Text>
        <Text tone="dim">{game.slug}</Text>
      </div>
      <div className={styles.featuredActions}>
        <Button
          type="button"
          variant="ghost"
          disabled={index === 0}
          onClick={onMoveUp}
          aria-label={`Move ${game.title} up`}
        >
          ↑
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={index === total - 1}
          onClick={onMoveDown}
          aria-label={`Move ${game.title} down`}
        >
          ↓
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onRemove}
          aria-label={`Remove ${game.title} from featured`}
        >
          Remove
        </Button>
      </div>
    </li>
  );
}

function AvailableGameRow({
  game,
  disabled,
  onAdd,
}: {
  game: AdminFeaturedGameItem;
  disabled: boolean;
  onAdd: () => void;
}) {
  const coverSrc = getGameCardCover(game);

  return (
    <li className={styles.featuredRow}>
      <img src={coverSrc} alt="" className={styles.featuredThumb} />
      <div className={styles.featuredMeta}>
        <Text>{game.title}</Text>
        <Text tone="dim">{game.platform}</Text>
      </div>
      <Button type="button" disabled={disabled} onClick={onAdd}>
        Add
      </Button>
    </li>
  );
}

export function AdminFeaturedGamesPage({
  resourceState,
}: AdminFeaturedGamesPageProps) {
  const isControlled = resourceState !== undefined;
  const { state: fetchedState, refetch } = useAdminResourceState(
    () => getAdminFeaturedGames(),
    parseFeaturedData,
  );
  const state = resourceState ?? fetchedState;
  const saveMutation = useAdminMutation<AdminFeaturedGamesResponse>();
  const [draftFeatured, setDraftFeatured] = useState<AdminFeaturedGameItem[] | null>(
    null,
  );
  const [message, setMessage] = useState<string | null>(null);

  const serverFeatured =
    state.status === 'success' ? state.data.featured : [];
  const serverAvailable =
    state.status === 'success' ? state.data.available : [];

  const featured = draftFeatured ?? serverFeatured;
  const featuredIds = useMemo(
    () => new Set(featured.map((game) => game.id)),
    [featured],
  );
  const available = useMemo(() => {
    const fromServer = serverAvailable.filter((game) => !featuredIds.has(game.id));
    const removedFromFeatured = serverFeatured.filter(
      (game) =>
        !featuredIds.has(game.id) &&
        !fromServer.some((item) => item.id === game.id),
    );
    return [...fromServer, ...removedFromFeatured];
  }, [serverAvailable, serverFeatured, featuredIds]);

  const isDirty =
    draftFeatured !== null &&
    (draftFeatured.length !== serverFeatured.length ||
      draftFeatured.some((game, index) => game.id !== serverFeatured[index]?.id));

  const handleSave = useCallback(() => {
    if (!draftFeatured) {
      return;
    }
    setMessage(null);
    saveMutation
      .mutate(() => updateAdminFeaturedGames(draftFeatured.map((game) => game.id)))
      .then((response) => {
        if (!response) {
          return;
        }
        if (isSetupResponse(response)) {
          setMessage(response.message);
          return;
        }
        setDraftFeatured(null);
        setMessage('Featured games saved.');
        refetch();
      });
  }, [draftFeatured, refetch, saveMutation]);

  const handleReset = () => {
    setDraftFeatured(null);
    setMessage(null);
  };

  return (
    <AdminPageShell>
      <Container>
        <AdminPageHeader
          title="Featured games"
          description="Choose up to five published titles for the homepage hero and featured grid. When none are selected, the five most recently released games are shown automatically."
          actions={
            <>
              <Link href="/admin/games">
                <Button type="button" variant="secondary">
                  Back to games
                </Button>
              </Link>
              {isDirty ? (
                <>
                  <Button type="button" variant="secondary" onClick={handleReset}>
                    Reset
                  </Button>
                  <Button
                    type="button"
                    disabled={saveMutation.status === 'pending'}
                    onClick={handleSave}
                  >
                    {saveMutation.status === 'pending' ? 'Saving…' : 'Save featured'}
                  </Button>
                </>
              ) : null}
            </>
          }
        />

        {message ? (
          <Text tone="muted" style={{ marginBottom: '1rem' }}>
            {message}
          </Text>
        ) : null}

        <AdminAsyncView state={state}>
          {(data) => (
            <div className={styles.featuredLayout}>
              <section className={styles.featuredPanel}>
                <Text tone="muted">
                  Featured slots ({featured.length}/{MAX_FEATURED})
                </Text>
                {featured.length === 0 ? (
                  <Text tone="dim" style={{ marginTop: '1rem' }}>
                    No curated featured games. The storefront uses the five latest
                    releases by default.
                  </Text>
                ) : (
                  <ul className={styles.featuredList}>
                    {featured.map((game, index) => (
                      <FeaturedGameRow
                        key={game.id}
                        game={game}
                        index={index}
                        total={featured.length}
                        onMoveUp={() => {
                          if (index === 0) return;
                          const next = [...featured];
                          [next[index - 1], next[index]] = [
                            next[index],
                            next[index - 1],
                          ];
                          setDraftFeatured(next);
                        }}
                        onMoveDown={() => {
                          if (index >= featured.length - 1) return;
                          const next = [...featured];
                          [next[index], next[index + 1]] = [
                            next[index + 1],
                            next[index],
                          ];
                          setDraftFeatured(next);
                        }}
                        onRemove={() => {
                          setDraftFeatured(
                            featured.filter((item) => item.id !== game.id),
                          );
                        }}
                      />
                    ))}
                  </ul>
                )}
              </section>

              <section className={styles.featuredPanel}>
                <Text tone="muted">Available published games</Text>
                {available.length === 0 ? (
                  <Text tone="dim" style={{ marginTop: '1rem' }}>
                    All published games are already featured.
                  </Text>
                ) : (
                  <ul className={styles.featuredList}>
                    {available.map((game) => (
                      <AvailableGameRow
                        key={game.id}
                        game={game}
                        disabled={featured.length >= MAX_FEATURED}
                        onAdd={() => {
                          if (featured.length >= MAX_FEATURED) return;
                          setDraftFeatured([...featured, game]);
                        }}
                      />
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </AdminAsyncView>
      </Container>
    </AdminPageShell>
  );
}
