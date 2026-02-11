import { test, expect } from '@playwright/test';
import { initReadinessMarker, waitForTauriReady } from '../helpers/state';
import { waitForNodeSynced, waitForBlockHeight } from '../helpers/wait-for';

test.describe('Real Node', () => {
  test.beforeEach(async ({ page }) => {
    await initReadinessMarker(page);
    await page.goto('/');
    await waitForTauriReady(page);
  });

  test('node starts and syncs on localnet', async ({ page }) => {
    const nodeStatus = await waitForNodeSynced(page, 120_000);
    expect(nodeStatus.is_synced).toBe(true);
  });

  test('block height increases over time', async ({ page }) => {
    await waitForNodeSynced(page);
    const initial = await waitForBlockHeight(page, 1);
    const initialHeight = initial.block_height ?? 1;
    await page.waitForTimeout(10_000);
    await waitForBlockHeight(page, initialHeight + 1);
  });
});
