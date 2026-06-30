import { vi } from 'vitest';

vi.mock('next/link', () => import('./test-utils/next-link-mock'));
