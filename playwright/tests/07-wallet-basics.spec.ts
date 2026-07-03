import { test, expect } from '../helpers/fixtures';
import { ensureBalance, getWalletBalance, waitForWalletReady, dismissDialogs } from '../helpers/wait-for';
import { waitForTauriReady, waitForAppReady } from '../helpers/state';
import { sel } from '../helpers/selectors';
import type { Page } from '@playwright/test';

/** Select a transaction-history filter option by its visible label. */
async function selectHistoryFilter(page: Page, label: RegExp) {
  const trigger = page.locator(sel.wallet.historyFilter);
  await trigger.waitFor({ state: 'visible', timeout: 15_000 });
  await trigger.click({ timeout: 10_000 });
  await page.getByText(label).first().click({ timeout: 5_000 });
  await page.waitForTimeout(1_000);
}

test.describe('Wallet Basics', () => {
  test('eye icon hides and shows the balance', async ({ appPage: page }) => {
    await waitForWalletReady(page, 300_000);
    const balance = page.locator(sel.wallet.balance);
    await balance.waitFor({ state: 'visible', timeout: 15_000 });

    // The eye button only mounts while the balance is hovered.
    const toggle = page.locator(sel.wallet.balanceVisibilityToggle);
    await balance.hover({ force: true });
    await toggle.waitFor({ state: 'visible', timeout: 10_000 });
    await toggle.dispatchEvent('click');
    await expect(balance).toContainText('*******', { timeout: 10_000 });

    // Restore visibility (the hidden-balance preference persists in config).
    await balance.hover({ force: true });
    await toggle.waitFor({ state: 'visible', timeout: 10_000 });
    await toggle.dispatchEvent('click');
    await expect(balance).not.toContainText('*******', { timeout: 10_000 });
  });

  test('balance persists across a page reload', async ({ appPage: page }) => {
    test.setTimeout(600_000);
    // A nonzero balance makes the check meaningful.
    await ensureBalance(page, 1, 300_000);
    const before = await getWalletBalance(page);
    expect(before).toBeGreaterThan(0);

    // Reload ≈ close/reopen for the frontend: the page reconnects and the
    // state replay repopulates the store from the running backend.
    await page.reload();
    await waitForTauriReady(page);
    await waitForAppReady(page);
    await dismissDialogs(page);
    await waitForWalletReady(page, 300_000);

    // The balance must survive the reload — it must not reset or fall back
    // to a stale-lower cache. It is NOT frozen: the wallet scan keeps
    // converging on the mined chain, so the live total is monotonic and
    // can tick up between the two reads. Persistence = still present and
    // no lower than before (small epsilon for float formatting).
    const after = await getWalletBalance(page);
    expect(after).toBeGreaterThan(0);
    expect(after).toBeGreaterThanOrEqual(before - 1);
  });

  test('history filters: all activity by default, rewards and transactions filter rows', async ({ appPage: page }) => {
    test.setTimeout(600_000);
    // Mining guarantees coinbase (reward) rows exist.
    await ensureBalance(page, 1, 300_000);

    // Default filter is "All activity".
    const trigger = page.locator(sel.wallet.historyFilter);
    await trigger.waitFor({ state: 'visible', timeout: 15_000 });
    await expect(trigger).toContainText(/all[\s-]?activity/i);

    // Rewards → only mined (coinbase) rows.
    await selectHistoryFilter(page, /^rewards$/i);
    const minedRows = page.locator(sel.wallet.txRowMined);
    await minedRows.first().waitFor({ state: 'visible', timeout: 60_000 });
    expect(await minedRows.count()).toBeGreaterThan(0);

    // Transactions → coinbase rows are excluded. (Whether any send rows
    // exist depends on run order, so the honest precondition-free
    // assertion is the absence of mined rows.)
    await selectHistoryFilter(page, /^transactions$/i);
    await expect(page.locator(sel.wallet.txRowMined)).toHaveCount(0, { timeout: 30_000 });

    // Back to All activity → mined rows return.
    await selectHistoryFilter(page, /all[\s-]?activity/i);
    await minedRows.first().waitFor({ state: 'visible', timeout: 30_000 });
  });
});
