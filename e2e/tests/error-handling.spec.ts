import { test, expect } from '@playwright/test';
import { initReadinessMarker, waitForTauriReady, setState } from '../helpers/state';
import { fixtures } from '../helpers/fixtures';

test.describe('Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await initReadinessMarker(page);
    await page.goto('/');
    await waitForTauriReady(page);
  });

  test('handles node disconnection', async ({ page }) => {
    await setState.baseNode(page, fixtures.nodeReady);
    await page.waitForTimeout(300);
    await setState.baseNode(page, fixtures.nodeDisconnected);
    await page.waitForTimeout(300);
  });

  test('handles connection status changes', async ({ page }) => {
    await setState.connectionStatus(page, 'InProgress');
    await page.waitForTimeout(300);
    await setState.connectionStatus(page, 'Succeed');
    await page.waitForTimeout(300);
  });
});
