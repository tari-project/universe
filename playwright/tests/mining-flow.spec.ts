import { test, expect, Page, BrowserContext } from '@playwright/test';
import { initReadinessMarker, waitForTauriReady } from '../helpers/state';
import {
  dismissDialogs,
  waitForMiningReady,
  clickStartMining,
  waitForMiningActive,
  clickStopMining,
  waitForMiningStopped,
  getWalletBalance,
  waitForWalletBalance,
} from '../helpers/wait-for';

let context: BrowserContext;
let page: Page;

test.beforeAll(async ({ browser }) => {
  context = await browser.newContext();
  page = await context.newPage();
  await initReadinessMarker(page);
  await page.goto('http://localhost:1420/');
  await waitForTauriReady(page);
  await dismissDialogs(page);
});

test.afterAll(async () => {
  await context?.close();
});

test.describe('Mining Flow', () => {
  test('app launches and mining controls become ready', async () => {
    await waitForMiningReady(page, 120_000);
    const startBtn = page.locator('[data-testid="mining-button-start"]');
    const resumeBtn = page.locator('[data-testid="mining-button-resume"]');
    await expect(startBtn.or(resumeBtn)).toBeVisible();
  });

  test('start mining via UI, verify active state, then stop', async () => {
    await waitForMiningReady(page, 60_000);
    await clickStartMining(page);

    await waitForMiningActive(page, 120_000);
    await expect(page.locator('[data-testid="mining-button-pause"]')).toBeVisible();

    await clickStopMining(page);
    await waitForMiningStopped(page, 60_000);
    const startBtn = page.locator('[data-testid="mining-button-start"]');
    const resumeBtn = page.locator('[data-testid="mining-button-resume"]');
    await expect(startBtn.or(resumeBtn)).toBeVisible();
  });

  test('wallet shows balance after mining', async () => {
    await waitForMiningReady(page, 60_000);
    const balanceBefore = await getWalletBalance(page);

    // Mine for a short burst then stop. On localnet blocks are produced
    // very fast (~100s per 10s), so a brief mining session is enough.
    // We must stop mining so the wallet scan can catch up to the new
    // block height — if mining keeps running, blocks pile up faster
    // than the wallet can scan them.
    await clickStartMining(page);
    await waitForMiningActive(page);
    await page.waitForTimeout(10_000);
    await clickStopMining(page);
    await waitForMiningStopped(page, 60_000);

    // Now wait for the wallet scan to process the mined blocks and
    // update the balance. This can take a while on localnet since
    // hundreds of blocks may have been produced.
    const balance = await waitForWalletBalance(page, Math.floor(balanceBefore) + 1, 120_000);
    expect(balance).toBeGreaterThan(balanceBefore);
  });

  test('coinbase transactions appear in the transaction list', async () => {
    // After the previous test, blocks have been mined and the wallet
    // scan has caught up. The coinbase transactions should appear in
    // the UI transaction list.
    const minedRow = page.locator('[data-testid="tx-row-mined"]');

    // Verify the backend has coinbase transactions via direct invoke
    const backendTxs = await page.evaluate(async () => {
      const fn = (window as any).__PLAYWRIGHT_INVOKE__;
      if (typeof fn !== 'function') return { count: 0 };
      try {
        const bitflag = (1 << 11) | (1 << 12) | (1 << 13) | 2015;
        const txs = await fn('get_transactions', {
          offset: 0, limit: 5, statusBitflag: bitflag,
        });
        return { count: Array.isArray(txs) ? txs.length : 0 };
      } catch { return { count: 0 }; }
    });
    expect(backendTxs.count).toBeGreaterThan(0);

    // Wait for react-query to fetch — the backend re-emits the wallet
    // address after setup completes, enabling the tx history query.
    await page.waitForTimeout(10_000);

    await minedRow.first().waitFor({ state: 'visible', timeout: 60_000 });
    const count = await minedRow.count();
    expect(count).toBeGreaterThan(0);

    // Verify the first mined row contains a "Block #" title
    const firstTitle = await minedRow.first().textContent();
    expect(firstTitle).toMatch(/Block\s*#\d+/i);
  });
});
