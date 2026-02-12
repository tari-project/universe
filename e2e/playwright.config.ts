import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: 'http://localhost:1420',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    {
      name: 'mock',
      testMatch: /tests\/(app-launch|mining|wallet|error-handling)\.spec\.ts/,
      timeout: 60_000,
    },
    {
      name: 'real',
      testMatch: /tests\/(real-.*|full-flow|mining-modes)\.spec\.ts/,
      timeout: 90_000,
      expect: {
        timeout: 30_000,
      },
    },
  ],

  globalSetup: './helpers/global-setup.ts',
  globalTeardown: './helpers/global-teardown.ts',
});
