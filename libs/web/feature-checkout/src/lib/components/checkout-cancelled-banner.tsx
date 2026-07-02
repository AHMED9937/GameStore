'use client';

import styles from './section.module.css';

export function CheckoutCancelledBanner() {
  return (
    <div
      className={`${styles.banner} ${styles.bannerInfo}`}
      role="status"
      data-testid="checkout-cancelled-banner"
    >
      Payment cancelled — you can try again when ready.
    </div>
  );
}
