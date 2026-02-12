import { test, expect } from '@playwright/test';
import { initReadinessMarker, waitForTauriReady } from '../helpers/state';
import { waitForNodeSynced, waitForBlockHeight, clickStartMining, clickStopMining, stopCpuMining } from '../helpers/wait-for';

test.describe('Real Mining', () => {
  test.beforeEach(async ({ page }) => {
    await initReadinessMarker(page);
    await page.goto('/');
    await waitForTauriReady(page);
    await waitForNodeSynced(page);
  });

  test.afterEach(async ({ page }) => {
    await stopCpuMining(page);
  });

  test('can start and stop CPU mining', async ({ page }) => {
    await clickStartMining(page);
    const height = await waitForBlockHeight(page, 1);
    expect(height).toBeGreaterThanOrEqual(1);
    await clickStopMining(page);
  });

  test('block height increases while mining', async ({ page }) => {
    await clickStartMining(page);
    const first = await waitForBlockHeight(page, 1);
    const next = await waitForBlockHeight(page, first + 1);
    expect(next).toBeGreaterThan(first);
  });
});
