import { test, expect } from '../helpers/shared-page';
import { waitForNodeSynced, waitForBlockHeight, clickStartMining, stopCpuMining, waitForWalletBalance } from '../helpers/wait-for';

test.describe('Real Wallet', () => {
  test.afterEach(async ({ sharedPage: page }) => {
    await stopCpuMining(page);
  });

  test('wallet connects after node sync', async ({ sharedPage: page }) => {
    await waitForNodeSynced(page);
    await expect(page).toHaveTitle(/Tari/i);
  });

  test('wallet balance increases after mining', async ({ sharedPage: page }) => {
    await waitForNodeSynced(page);
    await clickStartMining(page);
    await waitForBlockHeight(page, 5);
    const balance = await waitForWalletBalance(page, 0.001, 60_000);
    expect(balance).toBeGreaterThanOrEqual(0.001);
  });
});
