import { test, expect } from '@playwright/test';
import { initReadinessMarker, waitForTauriReady, setState } from '../helpers/state';
import { fixtures } from '../helpers/fixtures';

test.describe('Mining State', () => {
  test.beforeEach(async ({ page }) => {
    await initReadinessMarker(page);
    await page.goto('/');
    await waitForTauriReady(page);
    await setState.closeSplashscreen(page);
    await setState.connectionStatus(page, 'Succeed');
    await setState.baseNode(page, fixtures.nodeReady);
  });

  test('can inject CPU mining active state', async ({ page }) => {
    await setState.cpuMining(page, fixtures.cpuMiningActive);
    await page.waitForTimeout(200);
  });

  test('can inject GPU mining active state', async ({ page }) => {
    await setState.gpuMining(page, fixtures.gpuMiningActive);
    await page.waitForTimeout(200);
  });

  test('can transition from idle to mining', async ({ page }) => {
    await setState.cpuMining(page, fixtures.cpuMiningIdle);
    await page.waitForTimeout(200);
    await setState.cpuMining(page, fixtures.cpuMiningActive);
    await page.waitForTimeout(200);
  });
});
