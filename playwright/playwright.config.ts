import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  // @heavy tests exercise the most environment-coupled real-chain paths
  // (mode cycling, fast-mode dataset init). They run in a nightly/manual
  // lane (INCLUDE_HEAVY=1), not on every PR.
  grepInvert: process.env.INCLUDE_HEAVY ? undefined : /@heavy/,
  // Retries mask flakiness — the suite must pass deterministically.
  // Diagnostics below capture everything needed when a test does fail.
  retries: 0,
  workers: 1,
  // The app drives a real localnet chain: after a fast-hashrate session
  // the wallet scan can lag hundreds of blocks, so condition waits are
  // long. Individual waits are bounded; this only needs to exceed their
  // sum for the heaviest test.
  timeout: 360_000,
  expect: { timeout: 30_000 },
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    contextOptions: {
      reducedMotion: 'reduce',
    },
  },

  globalSetup: './helpers/global-setup.ts',
  globalTeardown: './helpers/global-teardown.ts',
});
