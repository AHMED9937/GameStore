'use client';

import { useEffect, useState } from 'react';
import { Button, Input, Text } from '@gamestore/shared/ui';
import type { AdminIgdbResultItem } from './admin-igdb.types';
import styles from './igdb.module.css';

const PLATFORM_OPTIONS = [
  { value: 'steam', label: 'Steam' },
  { value: 'epic', label: 'Epic' },
  { value: 'gog', label: 'GOG' },
  { value: 'origin', label: 'Origin' },
  { value: 'uplay', label: 'Ubisoft Connect' },
  { value: 'other', label: 'Other' },
] as const;

export type AdminIgdbImportDialogProps = {
  item: AdminIgdbResultItem | null;
  importing?: boolean;
  onClose: () => void;
  onConfirm: (options: {
    igdbId: number;
    platform: string;
    priceBase: number;
    slug?: string;
  }) => void;
};

export function AdminIgdbImportDialog({
  item,
  importing = false,
  onClose,
  onConfirm,
}: AdminIgdbImportDialogProps) {
  const [platform, setPlatform] = useState('steam');
  const [priceBase, setPriceBase] = useState('9.99');
  const [slug, setSlug] = useState('');

  useEffect(() => {
    if (!item) {
      return;
    }
    setPlatform('steam');
    setPriceBase('9.99');
    setSlug('');
  }, [item]);

  if (!item) {
    return null;
  }

  return (
    <div
      className={styles.importOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-igdb-import-title"
      data-testid="admin-igdb-import-dialog"
    >
      <div className={styles.importPanel}>
        <Text id="admin-igdb-import-title">
          Import <strong>{item.title}</strong>
        </Text>
        <Text tone="muted">
          Creates a draft game with IGDB metadata, cover, and gallery media.
        </Text>

        <div className={styles.importField}>
          <Text tone="muted">Platform</Text>
          <select
            className={styles.importSelect}
            value={platform}
            disabled={importing}
            onChange={(event) => setPlatform(event.target.value)}
          >
            {PLATFORM_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.importField}>
          <Text tone="muted">Base price (USD)</Text>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={priceBase}
            disabled={importing}
            onChange={(event) => setPriceBase(event.target.value)}
          />
        </div>

        <div className={styles.importField}>
          <Text tone="muted">Slug (optional)</Text>
          <Input
            value={slug}
            placeholder="auto-generated from title"
            disabled={importing}
            onChange={(event) => setSlug(event.target.value)}
          />
        </div>

        <div className={styles.importActions}>
          <Button type="button" variant="secondary" disabled={importing} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={importing}
            onClick={() => {
              const parsed = Number.parseFloat(priceBase);
              onConfirm({
                igdbId: item.igdbId,
                platform,
                priceBase: Number.isFinite(parsed) ? parsed : 9.99,
                slug: slug.trim() || undefined,
              });
            }}
          >
            {importing ? 'Importing…' : 'Import draft'}
          </Button>
        </div>
      </div>
    </div>
  );
}
