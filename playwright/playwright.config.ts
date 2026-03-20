import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    reducedMotion: 'reduce',
  },

  projects: [
    {
      name: 'wallet-integrity',
      testMatch: /01-wallet-integrity\.spec\.ts/,
      timeout: 180_000,
      expect: { timeout: 30_000 },
    },
    {
      name: 'mining-flow',
      testMatch: /02-mining-flow\.spec\.ts/,
      timeout: 180_000,
      expect: { timeout: 30_000 },
    },
    {
      name: 'exchange-miner',
      testMatch: /03-exchange-miner\.spec\.ts/,
      timeout: 180_000,
      expect: { timeout: 30_000 },
    },
  ],

  globalSetup: './helpers/global-setup.ts',
  globalTeardown: './helpers/global-teardown.ts',
});
