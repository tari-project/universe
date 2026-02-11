import { test, expect } from '@playwright/test';
import { initReadinessMarker, waitForTauriReady } from '../helpers/state';
import { waitForNodeSynced, waitForBlockHeight, startCpuMining, stopCpuMining, waitForMiningActive } from '../helpers/wait-for';

test.describe('Real Mining', () => {
  test.beforeEach(async ({ page }) => {
    await initReadinessMarker(page);
    await page.goto('/');
    await waitForTauriReady(page);
    await waitForNodeSynced(page);
  });

  test('can start CPU solo mining', async ({ page }) => {
    await startCpuMining(page);
    const result = await waitForMiningActive(page);
    expect(result).toBeTruthy();
  });

  test('block height increases while mining', async ({ page }) => {
    await startCpuMining(page);
    await waitForBlockHeight(page, 2);
  });

  test('can stop CPU mining', async ({ page }) => {
    await startCpuMining(page);
    await page.waitForTimeout(5_000);
    await stopCpuMining(page);
  });
});
