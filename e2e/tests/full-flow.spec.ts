import { test, expect } from '../helpers/shared-page';
import { waitForNodeSynced, waitForBlockHeight, clickStartMining, stopCpuMining, waitForWalletBalance } from '../helpers/wait-for';

test.describe('Full E2E Flow', () => {
  test('complete flow: launch → sync → mine → earn', async ({ sharedPage: page }) => {
    try {
      const nodeStatus = await waitForNodeSynced(page, 30_000);
      expect(nodeStatus.is_synced).toBe(true);

      await clickStartMining(page);

      const height = await waitForBlockHeight(page, 3, 30_000);
      expect(height).toBeGreaterThanOrEqual(3);

      const balance = await waitForWalletBalance(page, 0.001, 60_000);
      expect(balance).toBeGreaterThanOrEqual(0.001);
    } finally {
      await stopCpuMining(page);
    }
  });
});
