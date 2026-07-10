'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import styles from './ui.module.css';

export function NavigationProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [completing, setCompleting] = useState(false);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (prevPathname.current === pathname) {
      return;
    }

    prevPathname.current = pathname;
    setActive(true);
    setCompleting(false);

    const completeTimer = window.setTimeout(() => {
      setCompleting(true);
    }, 80);

    const hideTimer = window.setTimeout(() => {
      setActive(false);
      setCompleting(false);
    }, 480);

    return () => {
      window.clearTimeout(completeTimer);
      window.clearTimeout(hideTimer);
    };
  }, [pathname]);

  if (!active) {
    return null;
  }

  return (
    <div
      className={[
        styles.navigationProgress,
        completing ? styles.navigationProgressComplete : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="navigation-progress"
      aria-hidden="true"
    >
      <div className={styles.navigationProgressBar} />
    </div>
  );
}
