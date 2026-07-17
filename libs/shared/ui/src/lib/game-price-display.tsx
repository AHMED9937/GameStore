import type { HTMLAttributes, ReactNode } from 'react';
import { Text } from './text';
import styles from './game-price-display.module.css';

export type GameDiscountBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  percentOff: number;
};

/** Bold cover/ribbon SAVE badge — marketing-forward, not a mute chip. */
export function GameDiscountBadge({
  percentOff,
  className,
  ...props
}: GameDiscountBadgeProps) {
  return (
    <span
      className={[styles.saveBadge, className].filter(Boolean).join(' ')}
      data-testid="game-discount-badge"
      {...props}
    >
      <span className={styles.saveEyebrow}>Save</span>
      <span className={styles.saveValue}>{percentOff}%</span>
    </span>
  );
}

export type GamePriceDisplayProps = {
  priceBaseLabel: string;
  priceSaleLabel?: string | null;
  percentOff?: number | null;
  size?: 'sm' | 'md' | 'lg';
  meta?: ReactNode;
  className?: string;
  showPercentInline?: boolean;
  /** 'pill' fuses −% + deal price + was-price into one compact deal ticket. */
  variant?: 'default' | 'pill';
};

export function GamePriceDisplay({
  priceBaseLabel,
  priceSaleLabel = null,
  percentOff = null,
  size = 'md',
  meta,
  className,
  showPercentInline = false,
  variant = 'default',
}: GamePriceDisplayProps) {
  const discounted = Boolean(priceSaleLabel);
  const sizeClass =
    size === 'lg' ? styles.sizeLg : size === 'sm' ? styles.sizeSm : styles.sizeMd;

  if (variant === 'pill' && discounted) {
    return (
      <div
        className={[styles.priceBlock, sizeClass, className]
          .filter(Boolean)
          .join(' ')}
        data-testid="game-price-display"
      >
        <span className={styles.dealPill}>
          {percentOff != null ? (
            <span className={styles.dealPillSave} data-testid="game-inline-save">
              −{percentOff}%
            </span>
          ) : null}
          <span className={styles.dealPillPrice}>{priceSaleLabel}</span>
          <s className={styles.dealPillWas}>was {priceBaseLabel}</s>
        </span>
        {meta ? <div className={styles.metaRow}>{meta}</div> : null}
      </div>
    );
  }

  return (
    <div
      className={[styles.priceBlock, sizeClass, className].filter(Boolean).join(' ')}
      data-testid="game-price-display"
    >
      {discounted ? (
        <div className={styles.dealPriceRow}>
          <Text className={styles.salePrice}>{priceSaleLabel}</Text>
          <span className={styles.priceDivider} aria-hidden />
          <span className={styles.compareWrap}>
            <span className={styles.compareLabel}>Was</span>
            <Text tone="dim" className={styles.compareAt}>
              {priceBaseLabel}
            </Text>
          </span>
          {showPercentInline && percentOff != null ? (
            <span className={styles.inlineSave} data-testid="game-inline-save">
              −{percentOff}%
            </span>
          ) : null}
        </div>
      ) : (
        <div className={styles.priceRow}>
          <Text className={styles.basePrice}>{priceBaseLabel}</Text>
        </div>
      )}
      {meta ? <div className={styles.metaRow}>{meta}</div> : null}
    </div>
  );
}
