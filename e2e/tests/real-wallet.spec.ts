import { test, expect } from '@playwright/test';
import { initReadinessMarker, waitForTauriReady } from '../helpers/state';
import { waitForNodeSynced, waitForBlockHeight, startCpuMining, waitForWalletBalance } from '../helpers/wait-for';

test.describe('Real Wallet', () => {
  test.beforeEach(async ({ page }) => {
    await initReadinessMarker(page);
    await page.goto('/');
    await waitForTauriReady(page);
    await waitForNodeSynced(page);
  });

  test('wallet connects after node sync', async ({ page }) => {
    await expect(page).toHaveTitle(/Tari/i);
  });

  test('wallet balance increases after mining', async ({ page }) => {
    test.slow();
    await startCpuMining(page);
    await waitForBlockHeight(page, 5);
    await waitForWalletBalance(page, 0.001, 300_000);
  });
});
