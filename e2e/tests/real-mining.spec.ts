import { test, expect } from '../helpers/shared-page';
import { waitForNodeSynced, waitForBlockHeight, clickStartMining, stopCpuMining, waitForCpuMiningActive } from '../helpers/wait-for';

test.describe('Real Mining', () => {
  test.afterEach(async ({ sharedPage: page }) => {
    await stopCpuMining(page);
  });

  test('can start and stop CPU mining', async ({ sharedPage: page }) => {
    await waitForNodeSynced(page);
    await clickStartMining(page);
    await waitForCpuMiningActive(page);
    await stopCpuMining(page);
  });

  test('block height increases while mining', async ({ sharedPage: page }) => {
    await waitForNodeSynced(page);
    await clickStartMining(page);
    const first = await waitForBlockHeight(page, 1);
    const next = await waitForBlockHeight(page, first + 1);
    expect(next).toBeGreaterThan(first);
  });
});
