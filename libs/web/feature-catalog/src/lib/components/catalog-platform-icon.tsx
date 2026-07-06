import type { CatalogPlatformFilter } from '../catalog.constants';
import styles from './section.module.css';

type IconProps = {
  className?: string;
};

function IconGrid({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconSteam({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.798 20.307 6.384 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.606 0 11.979 0z" />
    </svg>
  );
}

function IconEpic({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 18.5V5.5l9 6.5-9 6.5zm10.5 0V5.5L22.5 12 13.5 18.5z" />
    </svg>
  );
}

function IconMicrosoft({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 3h8.5v8.5H3V3zm9.5 0H21v8.5h-8.5V3zM3 12.5h8.5V21H3v-8.5zm9.5 0H21V21h-8.5v-8.5z" />
    </svg>
  );
}

function IconUbisoft({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm0 2.2a7.8 7.8 0 1 0 0 15.6 7.8 7.8 0 0 0 0-15.6zm-1.05 3.9v7.8h2.1v-2.55h2.1c1.38 0 2.5-1.12 2.5-2.5s-1.12-2.5-2.5-2.5h-4.15z" />
    </svg>
  );
}

export function CatalogPlatformIcon({
  filter,
}: {
  filter: CatalogPlatformFilter;
}) {
  const className = styles.filterIcon;

  switch (filter) {
    case 'all':
      return <IconGrid className={className} />;
    case 'steam':
      return <IconSteam className={className} />;
    case 'epic':
      return <IconEpic className={className} />;
    case 'microsoft':
      return <IconMicrosoft className={className} />;
    case 'ubisoft':
      return <IconUbisoft className={className} />;
    default:
      return <IconGrid className={className} />;
  }
}

export function CatalogCardPlatformIcon({ platform }: { platform: string }) {
  const normalized = platform.trim().toLowerCase();
  const className = styles.cardPlatformIcon;

  switch (normalized) {
    case 'steam':
      return <IconSteam className={className} aria-hidden />;
    case 'epic':
      return <IconEpic className={className} aria-hidden />;
    case 'microsoft':
    case 'xbox':
      return <IconMicrosoft className={className} aria-hidden />;
    case 'ubisoft':
      return <IconUbisoft className={className} aria-hidden />;
    default:
      return <IconGrid className={className} aria-hidden />;
  }
}
