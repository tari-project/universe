import { test, expect } from '@playwright/test';
import { initReadinessMarker, waitForTauriReady, setState } from '../helpers/state';

test.describe('App Launch', () => {
  test('loads the application', async ({ page }) => {
    await initReadinessMarker(page);
    await page.goto('/');
    await waitForTauriReady(page);
    await expect(page).toHaveTitle(/Tari/i);
  });

  test('app responds to state injection', async ({ page }) => {
    await initReadinessMarker(page);
    await page.goto('/');
    await waitForTauriReady(page);

    await setState.closeSplashscreen(page);
    await setState.baseNode(page, {
      block_height: 100000,
      is_synced: true,
      num_connections: 5,
    });
    await setState.walletBalance(page, {
      available_balance: 1000000000,
    });
  });
});
