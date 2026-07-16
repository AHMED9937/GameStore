'use client';

import { useEffect, useState, type HTMLAttributes } from 'react';
import {
  getDiscountCountdownUnits,
  type DiscountCountdownUnits,
} from '@gamestore/shared/pricing';
import styles from './game-deal-urgency.module.css';

function pad2(value: number): string {
  return String(Math.max(0, value)).padStart(2, '0');
}

function CountdownBanner({
  units,
  size,
}: {
  units: DiscountCountdownUnits;
  size: 'banner' | 'bannerLg';
}) {
  const showDays = units.days > 0;
  const urgencyCopy =
    units.days === 0 && units.hours < 6 ? 'Ending soon' : 'Ends in';

  return (
    <div
      className={size === 'bannerLg' ? styles.bannerLg : styles.banner}
      aria-label={`Deal ends in ${units.days} days ${units.hours} hours ${units.minutes} minutes`}
      data-testid="game-deal-countdown"
    >
      <div className={styles.bannerCopy}>
        <span className={styles.bannerPulse} aria-hidden />
        <span className={styles.bannerEyebrow}>{urgencyCopy}</span>
      </div>
      <div className={styles.bannerDigits}>
        {showDays ? (
          <>
            <span className={styles.bannerTile}>
              <span className={styles.bannerValue}>{pad2(units.days)}</span>
              <span className={styles.bannerUnit}>Days</span>
            </span>
            <span className={styles.bannerColon} aria-hidden>
              :
            </span>
          </>
        ) : null}
        <span className={styles.bannerTile}>
          <span className={styles.bannerValue}>{pad2(units.hours)}</span>
          <span className={styles.bannerUnit}>Hrs</span>
        </span>
        <span className={styles.bannerColon} aria-hidden>
          :
        </span>
        <span className={styles.bannerTile}>
          <span className={styles.bannerValue}>{pad2(units.minutes)}</span>
          <span className={styles.bannerUnit}>Min</span>
        </span>
      </div>
    </div>
  );
}

export type GameDealUrgencyProps = HTMLAttributes<HTMLDivElement> & {
  endsAt?: string | null;
  showCountdown?: boolean;
  /** banner = catalog strip; bannerLg = featured / buy-panel strip */
  variant?: 'banner' | 'bannerLg';
};

export function GameDealUrgency({
  endsAt = null,
  showCountdown = false,
  variant = 'banner',
  className,
  ...props
}: GameDealUrgencyProps) {
  const [now, setNow] = useState(() => Date.now());
  const wantsCountdown = Boolean(showCountdown);

  useEffect(() => {
    if (!wantsCountdown || !endsAt) {
      return;
    }
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [wantsCountdown, endsAt]);

  const units =
    wantsCountdown && endsAt ? getDiscountCountdownUnits(endsAt, now) : null;

  if (!units) {
    return null;
  }

  return (
    <div
      className={[styles.root, styles.topSlot, className].filter(Boolean).join(' ')}
      data-testid="game-deal-urgency"
      {...props}
    >
      <CountdownBanner
        units={units}
        size={variant === 'bannerLg' ? 'bannerLg' : 'banner'}
      />
    </div>
  );
}
