'use client';

import { useId } from 'react';

/** Inline Offline Prism mark — faceted vault + incomplete offline seal ring. */
export function OfflinePrismMark({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, '');
  const facetId = `ognFacet-${uid}`;
  const coreId = `ognCore-${uid}`;

  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient
          id={facetId}
          x1="8"
          y1="6"
          x2="56"
          y2="58"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#a855f7" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient
          id={coreId}
          x1="24"
          y1="22"
          x2="40"
          y2="42"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#67e8f9" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <path
        d="M52.5 32a20.5 20.5 0 1 1-8.2-16.3"
        stroke={`url(#${facetId})`}
        strokeWidth="2.25"
        strokeLinecap="round"
        opacity="0.85"
      />
      <circle cx="52.5" cy="32" r="2.25" fill="#06b6d4" />
      <path
        d="M32 10 L48 24 L32 38 L16 24 Z"
        fill={`url(#${facetId})`}
        opacity="0.95"
      />
      <path d="M32 38 L48 24 L48 40 L32 54 Z" fill="#7c3aed" opacity="0.9" />
      <path d="M32 38 L16 24 L16 40 L32 54 Z" fill="#0891b2" opacity="0.85" />
      <path d="M32 20 L40 27 L32 34 L24 27 Z" fill={`url(#${coreId})`} />
      <path d="M32 34 L40 27 L40 35 L32 42 Z" fill="#a5f3fc" opacity="0.55" />
      <path d="M32 34 L24 27 L24 35 L32 42 Z" fill="#06b6d4" opacity="0.7" />
    </svg>
  );
}
