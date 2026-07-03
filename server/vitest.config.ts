import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    // mongodb-memory-server may download a binary on first run.
    hookTimeout: 120_000,
    testTimeout: 30_000,
    pool: 'forks',
  },
});
