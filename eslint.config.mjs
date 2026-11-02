import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      '**/dist',
      '**/node_modules',
      '**/.next',
      '**/coverage',
      '**/vitest.config.*.timestamp*',
      // Nx generator template sources are scaffolding, not workspace code.
      '**/src/generators/**/files*/**',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [
            '^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$',
            // Vitest mocks reference this lib via `typeof import(...)`, which Nx
            // misreads as a lazy dependency and then forbids its (valid) static
            // imports across the web tier. Allow its static imports explicitly.
            // (Stricter alternative: rewrite the mock type-imports instead.)
            '^@gamestore/web/data-access$',
          ],
          depConstraints: [
            {
              // Applications are the composition root: a deployable app may wire
              // together libraries from any scope. Library-to-library boundaries
              // below stay strict. (The Next.js web app is full-stack: its server
              // tier — route handlers, server actions, server-only libs — consumes
              // scope:api libs; client-bundle safety is enforced by `server-only`.)
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: ['*'],
            },
            {
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
            {
              sourceTag: 'scope:web',
              onlyDependOnLibsWithTags: ['scope:web', 'scope:shared'],
            },
            {
              sourceTag: 'scope:api',
              onlyDependOnLibsWithTags: ['scope:api', 'scope:shared'],
            },
          ],
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/*.mock', '**/*.stub'],
              message:
                'Mock/stub modules are only allowed in test files and libs/testing/test-utils.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.e2e-spec.ts',
      'apps/*-e2e/**/*.ts',
    ],
    rules: {
      'no-restricted-imports': 'off',
      // Tests legitimately import across boundaries and use `typeof import()` in
      // vi.mock factories; the latter is misread as a lazy dependency and would
      // otherwise flag every static import of the mocked lib in production code.
      '@nx/enforce-module-boundaries': 'off',
      // Empty callbacks/stubs are a normal mocking idiom in tests.
      '@typescript-eslint/no-empty-function': 'off',
    },
  },
  {
    files: ['libs/testing/test-utils/**/*.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    files: ['**/*.json'],
    // Override or add rules here
    rules: {},
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
];
