type IconProps = {
  className?: string;
};

export function IconEdit({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.04a1.003 1.003 0 0 0 0-1.42l-2.5-2.5a1.003 1.003 0 0 0-1.42 0l-1.96 1.96 3.75 3.75 2.13-1.79z"
      />
    </svg>
  );
}

export function IconPublish({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="m12 3 7 7h-4v8h-6v-8H5l7-7zm-9 16h18v2H3v-2z"
      />
    </svg>
  );
}

export function IconUnpublish({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M11 14h2V6h3l-4-4-4 4h3v8zm-8 4h18v2H3v-2zm13-5.59L17.41 14 20 11.41 21.41 12.82 18.82 15.41 21.41 18 20 19.41 17.41 16.82 14.82 19.41 13.41 18 16 15.41l-2.59-2.59 1.41-1.41z"
      />
    </svg>
  );
}

export function IconDeactivate({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm6.93 9H5.07A7.989 7.989 0 0 1 12 4a7.989 7.989 0 0 1 6.93 7z"
      />
    </svg>
  );
}

export function IconReactivate({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 4a8 8 0 0 1 7.75 6h-2.1A6 6 0 1 0 16 16l-2-2h6v6l-2.38-2.38A8 8 0 1 1 12 4z"
      />
    </svg>
  );
}

export function IconSoldOut({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 4h18l-7 8v6l-4 2v-8L3 4zm5.41 0L12 7.59 15.59 4H8.41z"
      />
      <path fill="currentColor" d="m4.41 3 16.18 16.18-1.41 1.41L3 4.41z" />
    </svg>
  );
}

export function IconAvailable({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 4h18l-7 8v6l-4 2v-8L3 4zm9 13.59V10.3L16.74 5H7.26L12 10.3v7.29z"
      />
    </svg>
  );
}

export function IconRevoke({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2a10 10 0 0 0-7.07 17.07A10 10 0 1 0 12 2zm0 2a7.96 7.96 0 0 1 5.24 1.95L5.95 17.24A8 8 0 0 1 12 4zm0 16a7.96 7.96 0 0 1-5.24-1.95L18.05 6.76A8 8 0 0 1 12 20z"
      />
    </svg>
  );
}
