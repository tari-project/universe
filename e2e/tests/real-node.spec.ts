import { test, expect } from '../helpers/shared-page';
import { waitForNodeSynced, waitForBlockHeight, clickStartMining, stopCpuMining } from '../helpers/wait-for';

test.describe('Real Node', () => {
  test('node starts and syncs on localnet', async ({ sharedPage: page }) => {
    const nodeStatus = await waitForNodeSynced(page, 30_000);
    expect(nodeStatus.is_synced).toBe(true);
  });

  test('block height increases while mining', async ({ sharedPage: page }) => {
    await waitForNodeSynced(page);
    await clickStartMining(page);
    try {
      const first = await waitForBlockHeight(page, 1);
      const next = await waitForBlockHeight(page, first + 1);
      expect(next).toBeGreaterThan(first);
    } finally {
      await stopCpuMining(page);
    }
  });
});
