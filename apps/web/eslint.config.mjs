import playwright from 'eslint-plugin-playwright';
import nextEslintPluginNext from '@next/eslint-plugin-next';
import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

export default [
  // Playwright rules apply only to e2e tests; apps/web holds vitest unit specs,
  // whose real Playwright suites live in apps/web-e2e.
  { ...playwright.configs['flat/recommended'], files: ['**/*.e2e-spec.ts', '**/e2e/**/*.{ts,tsx}'] },
  { plugins: { '@next/next': nextEslintPluginNext } },
  ...nx.configs['flat/react-typescript'],
  ...baseConfig,
  {
    ignores: ['.next/**/*'],
  },
  {
    files: ['**/*.ts', '**/*.js'],
    // Override or add rules here
    rules: {},
  },
];
