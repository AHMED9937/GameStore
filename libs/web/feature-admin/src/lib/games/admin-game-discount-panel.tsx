'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  computeSalePrice,
  formatPriceAmount,
  isValidDiscountDuration,
} from '@gamestore/shared/pricing';
import { Badge, Button, Card, Input, Text } from '@gamestore/shared/ui';
import {
  apiErrorMessage,
  endAdminGameDiscount,
  formatGamePrice,
  isSetupResponse,
  upsertAdminGameDiscount,
  type AdminGameDiscount,
} from '@gamestore/web/data-access';
import styles from './games.module.css';

export type AdminGameDiscountPanelProps = {
  gameId: string;
  priceBase: string;
  discount: AdminGameDiscount | null;
  disabled?: boolean;
  onDiscountChange?: (discount: AdminGameDiscount | null) => void;
};

type DiscountFormState = {
  percentOff: string;
  durationDays: string;
  durationHours: string;
  showCountdown: boolean;
};

function emptyForm(): DiscountFormState {
  return {
    percentOff: '20',
    durationDays: '1',
    durationHours: '0',
    showCountdown: true,
  };
}

function formFromDiscount(discount: AdminGameDiscount | null): DiscountFormState {
  if (!discount) {
    return emptyForm();
  }
  return {
    percentOff: String(discount.percentOff),
    durationDays: String(discount.durationDays),
    durationHours: String(discount.durationHours),
    showCountdown: discount.showCountdown,
  };
}

function statusLabel(discount: AdminGameDiscount | null): string {
  if (!discount) {
    return 'No promo';
  }
  switch (discount.status) {
    case 'active':
      return 'Active';
    case 'scheduled':
      return 'Scheduled';
    case 'expired':
      return 'Expired';
    case 'disabled':
      return 'Ended';
    default:
      return 'No promo';
  }
}

function statusVariant(
  discount: AdminGameDiscount | null,
): 'default' | 'success' | 'accent' {
  if (!discount) {
    return 'default';
  }
  if (discount.status === 'active') {
    return 'success';
  }
  if (discount.status === 'scheduled') {
    return 'accent';
  }
  return 'default';
}

function parseIntField(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isInteger(parsed) ? parsed : null;
}

export function AdminGameDiscountPanel({
  gameId,
  priceBase,
  discount,
  disabled = false,
  onDiscountChange,
}: AdminGameDiscountPanelProps) {
  const [form, setForm] = useState<DiscountFormState>(() =>
    formFromDiscount(discount),
  );
  const [saving, setSaving] = useState(false);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setForm(formFromDiscount(discount));
    setError(null);
    setMessage(null);
  }, [discount]);

  const previewSale = useMemo(() => {
    const percent = parseIntField(form.percentOff);
    if (percent === null) {
      return null;
    }
    const sale = computeSalePrice(priceBase, percent);
    return Number.isFinite(sale) ? formatPriceAmount(sale) : null;
  }, [form.percentOff, priceBase]);

  const validationError = useMemo(() => {
    const percent = parseIntField(form.percentOff);
    if (percent === null || percent < 1 || percent > 100) {
      return 'Percent off must be an integer from 1 to 100.';
    }
    const days = parseIntField(form.durationDays) ?? 0;
    const hours = parseIntField(form.durationHours) ?? 0;
    if (!isValidDiscountDuration({ days, hours })) {
      return 'Set at least one day or hour for the promo duration.';
    }
    if (previewSale === null) {
      return 'Sale price must stay greater than zero.';
    }
    return null;
  }, [form, previewSale]);

  const busy = disabled || saving || ending;

  async function handleSave() {
    if (validationError || busy) {
      setError(validationError);
      return;
    }

    const percentOff = parseIntField(form.percentOff)!;
    const durationDays = parseIntField(form.durationDays) ?? 0;
    const durationHours = parseIntField(form.durationHours) ?? 0;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const result = await upsertAdminGameDiscount(gameId, {
        percentOff,
        durationDays,
        durationHours,
        showCountdown: form.showCountdown,
        enabled: true,
      });

      if (isSetupResponse(result)) {
        setError(result.message);
        return;
      }

      onDiscountChange?.(result);
      setMessage('Discount promo saved. It starts immediately.');
    } catch (saveError: unknown) {
      setError(apiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function handleEnd() {
    if (busy || !discount || discount.status === 'disabled') {
      return;
    }

    setEnding(true);
    setError(null);
    setMessage(null);

    try {
      const result = await endAdminGameDiscount(gameId);
      if (isSetupResponse(result)) {
        setError(result.message);
        return;
      }
      onDiscountChange?.(
        discount
          ? { ...discount, enabled: false, status: 'disabled' }
          : null,
      );
      setMessage('Promo ended.');
    } catch (endError: unknown) {
      setError(apiErrorMessage(endError));
    } finally {
      setEnding(false);
    }
  }

  return (
    <Card
      className={styles.marketingPlatformPanel}
      data-testid="admin-game-discount-panel"
      aria-labelledby="admin-game-discount-heading"
    >
      <div className={styles.discordPanelHeader}>
        <h4 id="admin-game-discount-heading" className={styles.discordHeading}>
          Limited-time discount
        </h4>
        <Badge
          variant={statusVariant(discount)}
          data-testid="admin-game-discount-status"
        >
          {statusLabel(discount)}
        </Badge>
      </div>
      <Text tone="muted">
        Percentage off the base price. Sale starts when you save and ends after
        the duration.
      </Text>

      <div className={styles.discountPreview} data-testid="admin-game-discount-preview">
        <Text>
          Was {formatGamePrice(priceBase)}
          {previewSale ? (
            <>
              {' '}
              → Now {formatGamePrice(previewSale)}
            </>
          ) : null}
        </Text>
      </div>

      <div className={styles.discountGrid}>
        <label className={styles.formField}>
          <Text>Percent off</Text>
          <Input
            type="number"
            min={1}
            max={100}
            value={form.percentOff}
            disabled={busy}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                percentOff: event.target.value,
              }))
            }
            data-testid="admin-game-discount-percent"
          />
        </label>
        <label className={styles.formField}>
          <Text>Duration (days)</Text>
          <Input
            type="number"
            min={0}
            value={form.durationDays}
            disabled={busy}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                durationDays: event.target.value,
              }))
            }
            data-testid="admin-game-discount-days"
          />
        </label>
        <label className={styles.formField}>
          <Text>Duration (hours)</Text>
          <Input
            type="number"
            min={0}
            value={form.durationHours}
            disabled={busy}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                durationHours: event.target.value,
              }))
            }
            data-testid="admin-game-discount-hours"
          />
        </label>
      </div>

      <label className={styles.checkboxField}>
        <input
          type="checkbox"
          checked={form.showCountdown}
          disabled={busy}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              showCountdown: event.target.checked,
            }))
          }
          data-testid="admin-game-discount-show-countdown"
        />
        <Text>Show countdown on storefront</Text>
      </label>

      {error ? (
        <Text tone="muted" className={styles.formMessage} data-testid="admin-game-discount-error">
          {error}
        </Text>
      ) : null}
      {message ? (
        <Text tone="muted" className={styles.formMessage} data-testid="admin-game-discount-message">
          {message}
        </Text>
      ) : null}

      <div className={styles.formActions}>
        <Button
          type="button"
          variant="primary"
          disabled={busy || Boolean(validationError)}
          onClick={() => void handleSave()}
          data-testid="admin-game-discount-save"
        >
          {saving ? 'Saving…' : 'Save promo'}
        </Button>
        {discount && discount.status !== 'disabled' ? (
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => void handleEnd()}
            data-testid="admin-game-discount-end"
          >
            {ending ? 'Ending…' : 'End promo'}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
