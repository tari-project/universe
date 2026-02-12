import { test, expect } from '@playwright/test';
import { initReadinessMarker, waitForTauriReady } from '../helpers/state';
import { waitForNodeSynced, waitForBlockHeight, clickStartMining, stopCpuMining, waitForWalletBalance } from '../helpers/wait-for';

test.describe('Full E2E Flow', () => {
  test('complete flow: launch → sync → mine → earn', async ({ page }) => {
    await initReadinessMarker(page);
    await page.goto('/');
    await waitForTauriReady(page);

    try {
      // Step 1: Node syncs
      const nodeStatus = await waitForNodeSynced(page, 30_000);
      expect(nodeStatus.is_synced).toBe(true);

      // Step 2: Start mining via the UI button
      await clickStartMining(page);

      // Step 3: Blocks are produced (read from UI)
      const height = await waitForBlockHeight(page, 3, 30_000);
      expect(height).toBeGreaterThanOrEqual(3);

      // Step 4: Wallet receives rewards (read from UI)
      const balance = await waitForWalletBalance(page, 0.001, 60_000);
      expect(balance).toBeGreaterThanOrEqual(0.001);
    } finally {
      await stopCpuMining(page);
    }
  });
});
