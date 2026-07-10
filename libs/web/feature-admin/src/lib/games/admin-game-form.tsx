'use client';

import { Button, Input, Text } from '@gamestore/shared/ui';
import type { AdminGameFormValues, AdminGameTab } from './admin-games.types';
import { AdminGameRequirementsFields } from './admin-game-requirements-fields';
import styles from './games.module.css';

const TABS: { id: AdminGameTab; label: string }[] = [
  { id: 'basics', label: 'Basics' },
  { id: 'storefront', label: 'Storefront' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'media', label: 'Media' },
  { id: 'accounts', label: 'Steam account' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'publish', label: 'Publish' },
];

export type AdminGameFormProps = {
  values?: AdminGameFormValues;
  coverCardImage?: string | null;
  disabled?: boolean;
  mode?: 'create' | 'edit';
  activeTab?: AdminGameTab;
  onTabChange?: (tab: AdminGameTab) => void;
  onValuesChange?: (values: AdminGameFormValues) => void;
  mediaSection?: React.ReactNode;
  accountsSection?: React.ReactNode;
  marketingSection?: React.ReactNode;
  publishSection?: React.ReactNode;
};

export function AdminGameForm({
  values,
  coverCardImage,
  disabled = false,
  mode = 'create',
  activeTab = 'basics',
  onTabChange,
  onValuesChange,
  mediaSection,
  accountsSection,
  marketingSection,
  publishSection,
}: AdminGameFormProps) {
  const controlled = Boolean(onValuesChange);
  const formValues = values;

  if (!formValues) {
    return null;
  }

  const updateField = <K extends keyof AdminGameFormValues>(
    field: K,
    nextValue: AdminGameFormValues[K],
  ) => {
    onValuesChange?.({
      ...formValues,
      [field]: nextValue,
    });
  };

  const handleTitleBlur = () => {
    if (!formValues.slug.trim() && formValues.title.trim()) {
      updateField('slug', slugifyTitle(formValues.title));
    }
  };

  return (
    <div className={styles.form} aria-label="Game details">
      {onTabChange ? (
        <div className={styles.tabBar} role="tablist">
          {TABS.map((tab) => (
            <Button
              key={tab.id}
              type="button"
              variant={activeTab === tab.id ? 'primary' : 'secondary'}
              onClick={() => onTabChange(tab.id)}
              disabled={disabled}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      ) : null}

      {activeTab === 'basics' ? (
        <>
          <div className={styles.formField}>
            <Text tone="muted">Title</Text>
            <Input
              name="title"
              value={formValues.title}
              disabled={disabled}
              onChange={(event) => updateField('title', event.target.value)}
              onBlur={handleTitleBlur}
            />
          </div>
          <div className={styles.formField}>
            <Text tone="muted">Slug</Text>
            <Input
              name="slug"
              value={formValues.slug}
              disabled={disabled}
              onChange={(event) => updateField('slug', event.target.value)}
            />
          </div>
          <div className={styles.formField}>
            <Text tone="muted">Platform</Text>
            <Input
              name="platform"
              value={formValues.platform}
              disabled={disabled || mode === 'edit'}
              readOnly={mode === 'edit'}
              onChange={(event) => updateField('platform', event.target.value)}
            />
            {mode === 'create' ? (
              <Text tone="dim">New manual games are Steam-only in this phase.</Text>
            ) : null}
          </div>
          <div className={styles.formField}>
            <Text tone="muted">Base price (USD)</Text>
            <Input
              name="priceBase"
              type="number"
              step="0.01"
              value={formValues.priceBase}
              disabled={disabled}
              onChange={(event) => updateField('priceBase', event.target.value)}
            />
          </div>
        </>
      ) : null}

      {activeTab === 'storefront' ? (
        <>
          <div className={styles.formField}>
            <Text tone="muted">Description</Text>
            <textarea
              className={styles.textarea}
              name="description"
              rows={8}
              value={formValues.description}
              disabled={disabled}
              onChange={(event) => updateField('description', event.target.value)}
            />
            <Text tone="dim">Use blank lines between paragraphs.</Text>
          </div>
          <div className={styles.formField}>
            <Text tone="muted">Meta title</Text>
            <Input
              name="metaTitle"
              value={formValues.metaTitle}
              disabled={disabled}
              onChange={(event) => updateField('metaTitle', event.target.value)}
              placeholder="Auto-generated from game title when blank"
            />
            <Text tone="dim">
              {formValues.metaTitle.length}/60 — Leave blank to use auto-generated defaults.
              IGDB import pre-fills these on first import.
            </Text>
          </div>
          <div className={styles.formField}>
            <Text tone="muted">Meta description</Text>
            <textarea
              className={styles.textarea}
              name="metaDescription"
              rows={3}
              value={formValues.metaDescription}
              disabled={disabled}
              onChange={(event) => updateField('metaDescription', event.target.value)}
              placeholder="Short summary for search results"
            />
            <Text tone="dim">{formValues.metaDescription.length}/160</Text>
          </div>
          <div className={styles.formField}>
            <Text tone="muted">OG image URL</Text>
            <Input
              name="ogImage"
              value={formValues.ogImage}
              disabled={disabled}
              onChange={(event) => updateField('ogImage', event.target.value)}
              placeholder={formValues.coverImage || 'Uses cover image when blank'}
            />
          </div>
          <div className={styles.formField}>
            <Text tone="muted">Cover image URL</Text>
            <Input
              name="coverImage"
              value={formValues.coverImage}
              disabled={disabled}
              onChange={(event) => updateField('coverImage', event.target.value)}
            />
          </div>
          {mode === 'edit' && coverCardImage?.trim() ? (
            <div className={styles.formField}>
              <Text tone="muted">Card cover URL (IGDB)</Text>
              <Input name="coverCardImage" value={coverCardImage} disabled readOnly />
            </div>
          ) : null}
          <div className={styles.formField}>
            <Text tone="muted">Release date</Text>
            <Input
              name="releaseDate"
              type="date"
              value={formValues.releaseDate}
              disabled={disabled}
              onChange={(event) => updateField('releaseDate', event.target.value)}
            />
          </div>
          <div className={styles.formField}>
            <Text tone="muted">Genres (comma-separated)</Text>
            <Input
              name="genres"
              value={formValues.genresText}
              disabled={disabled}
              onChange={(event) => updateField('genresText', event.target.value)}
              placeholder="Adventure, Sci-Fi"
            />
          </div>
        </>
      ) : null}

      {activeTab === 'requirements' ? (
        <div className={styles.requirementsGrid}>
          <AdminGameRequirementsFields
            title="Minimum requirements"
            values={formValues.requirementsMin}
            disabled={disabled}
            onChange={(requirementsMin) => updateField('requirementsMin', requirementsMin)}
          />
          <AdminGameRequirementsFields
            title="Recommended requirements"
            values={formValues.requirementsRecommended}
            disabled={disabled}
            onChange={(requirementsRecommended) =>
              updateField('requirementsRecommended', requirementsRecommended)
            }
          />
        </div>
      ) : null}

      {activeTab === 'media' ? mediaSection : null}
      {activeTab === 'accounts' ? accountsSection : null}
      {activeTab === 'marketing' ? marketingSection : null}
      {activeTab === 'publish' ? publishSection : null}
    </div>
  );
}

function slugifyTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
