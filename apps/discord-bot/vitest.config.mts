import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'discord-bot',
    include: ['src/**/*.spec.ts'],
    environment: 'node',
    root: __dirname,
  },
});
