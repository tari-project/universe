import { test, expect } from '@playwright/test';
import { initReadinessMarker, waitForTauriReady } from '../helpers/state';
import { waitForNodeSynced, waitForBlockHeight, clickStartMining, stopCpuMining, waitForWalletBalance } from '../helpers/wait-for';

test.describe('Real Wallet', () => {
  test.beforeEach(async ({ page }) => {
    await initReadinessMarker(page);
    await page.goto('/');
    await waitForTauriReady(page);
    await waitForNodeSynced(page);
  });

  test.afterEach(async ({ page }) => {
    await stopCpuMining(page);
  });

  test('wallet connects after node sync', async ({ page }) => {
    await expect(page).toHaveTitle(/Tari/i);
  });

  test('wallet balance increases after mining', async ({ page }) => {
    await clickStartMining(page);
    await waitForBlockHeight(page, 5);
    const balance = await waitForWalletBalance(page, 0.001, 60_000);
    expect(balance).toBeGreaterThanOrEqual(0.001);
  });
});
