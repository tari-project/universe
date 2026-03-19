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
import { sel } from '../helpers/selectors';

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

  test('start mining and cycle through Eco, Turbo, Ludicrous modes', async () => {
    await waitForMiningReady(page, 120_000);
    await clickStartMining(page);
    await waitForMiningActive(page, 120_000);

    const cpuTile = page.locator(sel.mining.tileCpu);
    // There are two mode triggers (mining sidebar + scheduler).
    // Use nth(1) — the second one is in the mining sidebar.
    const modeTrigger = page.locator(sel.mode.trigger).nth(1);

    // Helper: wait for hashrate to appear in the CPU tile
    const waitForHashrate = async (timeout = 30_000) => {
      const start = Date.now();
      while (Date.now() - start < timeout) {
        const text = await cpuTile.textContent({ timeout: 2_000 }).catch(() => '');
        if (/[HGMk]\/s/.test(text ?? '') && !/\.\.\./.test(text ?? '')) return;
        await page.waitForTimeout(1_000);
      }
      throw new Error(`Hashrate did not appear within ${timeout}ms`);
    };

    // Helper: select a mining mode from the dropdown
    const selectMode = async (modeName: string) => {
      const option = page.locator(`[data-testid="mining-mode-${modeName}"]`);
      // Retry: open dropdown, check if option is visible, click it.
      // The dropdown may be empty initially while config events
      // haven't arrived yet from the backend state replay.
      const start = Date.now();
      while (Date.now() - start < 60_000) {
        try {
          await modeTrigger.click({ timeout: 10_000 });
        } catch {
          await page.waitForTimeout(2_000);
          continue;
        }
        await page.waitForTimeout(500);
        if (await option.isVisible().catch(() => false)) {
          await option.click({ timeout: 5_000 });
          return;
        }
        // Close the empty dropdown by clicking elsewhere, then retry
        await page.keyboard.press('Escape');
        await page.waitForTimeout(3_000);
      }
      throw new Error(`Could not select mining mode: ${modeName}`);
    };

    // --- Eco (default) ---
    await waitForHashrate();

    // --- Turbo ---
    await selectMode('Turbo');
    await waitForMiningActive(page, 60_000);
    await waitForHashrate(60_000);

    // --- Ludicrous (requires confirmation dialog) ---
    await selectMode('Ludicrous');
    const confirmBtn = page.locator(sel.mode.ludicrousConfirm);
    await confirmBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await confirmBtn.click({ timeout: 5_000 });
    await waitForMiningActive(page, 60_000);
    await waitForHashrate(60_000);

    // --- Back to Eco ---
    await selectMode('Eco');
    await waitForMiningActive(page, 60_000);
    await waitForHashrate(60_000);

    await clickStopMining(page);
    await waitForMiningStopped(page, 60_000);
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

  test('mining recovers after xmrig process is killed', async () => {
    await waitForMiningReady(page, 60_000);
    await clickStartMining(page);
    await waitForMiningActive(page);

    const cpuTile = page.locator('[data-testid="mining-tile-cpu"]');

    // Check if the CPU tile shows a hashrate (unit like H/s or G/s visible)
    const hasHashrate = async () => {
      const text = await cpuTile.textContent({ timeout: 2_000 }).catch(() => '');
      return /[HGMk]\/s/.test(text ?? '') && !/\.\.\./.test(text ?? '');
    };

    const hrStart = Date.now();
    while (Date.now() - hrStart < 30_000) {
      if (await hasHashrate()) break;
      await page.waitForTimeout(1_000);
    }
    expect(await hasHashrate()).toBe(true);

    // Read the xmrig PID from the PID file written by the process watcher
    const fs = await import('fs');
    const path = await import('path');
    const os = await import('os');
    const appDir = process.platform === 'darwin'
      ? path.join(os.homedir(), 'Library/Application Support/com.tari.universe.alpha')
      : path.join(os.homedir(), '.local/share/com.tari.universe.alpha');
    const pidFilePath = path.join(appDir, 'xmrig_pid');
    const xmrigPid = parseInt(fs.readFileSync(pidFilePath, 'utf-8').trim(), 10);
    expect(xmrigPid).toBeGreaterThan(0);

    // Kill xmrig
    process.kill(xmrigPid, 'SIGKILL');

    // Wait for the hashrate to disappear (process is dead)
    const deadStart = Date.now();
    while (Date.now() - deadStart < 15_000) {
      if (!(await hasHashrate())) break;
      await page.waitForTimeout(1_000);
    }

    // Now wait for the hashrate to come back (process watcher restarts xmrig)
    const recoveryStart = Date.now();
    while (Date.now() - recoveryStart < 120_000) {
      if (await hasHashrate()) break;
      await page.waitForTimeout(2_000);
    }
    expect(await hasHashrate()).toBe(true);

    await clickStopMining(page);
    await waitForMiningStopped(page, 60_000);
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
