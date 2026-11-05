import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests-l2',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    workers: 1,
    retries: 0,
    timeout: 360_000,
    expect: { timeout: 30_000 },
    outputDir: './test-results-l2',
    reporter: [['html', { open: 'never', outputFolder: 'playwright-l2-report' }], ['list']],
    use: {
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        contextOptions: { reducedMotion: 'reduce' },
    },
    globalSetup: './helpers/l2/global-setup.ts',
    globalTeardown: './helpers/l2/global-teardown.ts',
});
