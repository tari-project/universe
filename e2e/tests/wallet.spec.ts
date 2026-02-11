import { test, expect } from '@playwright/test';
import { initReadinessMarker, waitForTauriReady, setState } from '../helpers/state';
import { fixtures } from '../helpers/fixtures';

test.describe('Wallet State', () => {
  test.beforeEach(async ({ page }) => {
    await initReadinessMarker(page);
    await page.goto('/');
    await waitForTauriReady(page);
    await setState.closeSplashscreen(page);
    await setState.connectionStatus(page, 'Succeed');
    await setState.baseNode(page, fixtures.nodeReady);
  });

  test('can inject wallet balance', async ({ page }) => {
    await setState.walletBalance(page, fixtures.walletFunded);
    await page.waitForTimeout(200);
  });

  test('can show empty wallet', async ({ page }) => {
    await setState.walletBalance(page, fixtures.walletEmpty);
    await page.waitForTimeout(200);
  });

  test('can show pending incoming balance', async ({ page }) => {
    await setState.walletBalance(page, {
      available_balance: 1000000000,
      pending_incoming_balance: 500000000,
    });
    await page.waitForTimeout(200);
  });
});
