import { test, expect } from '@playwright/test';
import { initReadinessMarker, waitForTauriReady } from '../helpers/state';
import { waitForNodeSynced, waitForBlockHeight, startCpuMining, waitForWalletBalance } from '../helpers/wait-for';

test.describe('Full E2E Flow', () => {
  test('complete flow: launch → sync → mine → earn', async ({ page }) => {
    test.slow();

    await initReadinessMarker(page);
    await page.goto('/');
    await waitForTauriReady(page);

    // Step 1: Node syncs
    const nodeStatus = await waitForNodeSynced(page, 180_000);
    expect(nodeStatus.is_synced).toBe(true);

    // Step 2: Start mining
    await startCpuMining(page);

    // Step 3: Blocks are produced
    await waitForBlockHeight(page, 3, 120_000);

    // Step 4: Wallet receives rewards
    await waitForWalletBalance(page, 0.001, 300_000);
  });
});
