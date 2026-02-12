import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },

  projects: [
    {
      name: 'real',
      testMatch: /tests\/all-e2e\.spec\.ts/,
      timeout: 180_000,
      expect: {
        timeout: 30_000,
      },
    },
  ],

  globalSetup: './helpers/global-setup.ts',
  globalTeardown: './helpers/global-teardown.ts',
});
