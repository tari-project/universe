import { test, expect } from '../helpers/fixtures';
import {
  waitForMiningReady,
  clickStartMining,
  waitForMiningActive,
  clickStopMining,
  waitForMiningStopped,
  getWalletBalance,
  mineUntilBalanceExceeds,
  ensureBalance,
  waitForWalletReady,
} from '../helpers/wait-for';
import { sel } from '../helpers/selectors';
import { getAppDataDir } from '../helpers/app-dirs';
import type { Page } from '@playwright/test';

/**
 * Read the CPU tile's hashrate. The digits render inside a NumberFlow
 * shadow root (invisible to text content), so the tile exposes the raw
 * value via data-rate. Returns null when no rate is shown (loading /
 * syncing). IMPORTANT: 0 is a real value during miner startup — treat
 * only a NONZERO value as mining.
 */
async function readHashrate(page: Page): Promise<number | null> {
  const raw = await page
    .locator(sel.mining.tileCpu)
    .getAttribute('data-rate', { timeout: 2_000 })
    .catch(() => null);
  if (raw === null || raw === '') return null;
  const value = parseFloat(raw);
  return Number.isNaN(value) ? null : value;
}

/** Wait for a real, nonzero hashrate in the CPU tile. */
async function waitForHashrate(page: Page, timeout = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const rate = await readHashrate(page);
    if (rate !== null && rate > 0) return;
    await page.waitForTimeout(1_000);
  }
  throw new Error(`Hashrate did not appear within ${timeout}ms`);
}

/**
 * Wait for the CPU tile to STOP showing a nonzero hashrate. Used after a
 * mode change: the tile keeps the previous session's value until the miner
 * restart propagates, so waiting for reset first prevents a stale value
 * from satisfying the next waitForHashrate.
 */
async function waitForHashrateReset(page: Page, timeout = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const rate = await readHashrate(page);
    if (rate === null || rate === 0) return;
    await page.waitForTimeout(1_000);
  }
  throw new Error(`Hashrate did not reset within ${timeout}ms`);
}

/**
 * Read the highest block height visible in the UI — the accent counter
 * when rendered, otherwise the "Block: #N" cards in the miners strip.
 */
async function readBlockHeight(page: Page): Promise<number | null> {
  const accent = await page
    .locator(sel.node.blockHeight)
    .textContent({ timeout: 2_000 })
    .catch(() => null);
  if (accent) {
    const n = parseInt(accent.replace(/\D/g, ''), 10);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  const cards = await page
    .getByText(/Block: #[\d,]+/)
    .allTextContents()
    .catch(() => [] as string[]);
  const nums = cards
    .map((t) => parseInt(t.replace(/\D/g, ''), 10))
    .filter((n) => !Number.isNaN(n) && n > 0);
  return nums.length ? Math.max(...nums) : null;
}

/** Wait until the chain tip visibly advances — the honest "mining works" signal. */
async function waitForBlockHeightIncrease(page: Page, timeout = 120_000) {
  const start = Date.now();
  let base: number | null = null;
  while (Date.now() - start < timeout) {
    const h = await readBlockHeight(page);
    if (h !== null) {
      if (base === null) {
        base = h;
      } else if (h > base) {
        return;
      }
    }
    await page.waitForTimeout(2_000);
  }
  throw new Error(`Block height did not increase within ${timeout}ms`);
}

test.describe('Mining Flow', () => {
  test('app launches and mining controls become ready', async ({ appPage: page }) => {
    await waitForMiningReady(page, 120_000);
    const startBtn = page.locator(sel.mining.startButton);
    const resumeBtn = page.locator(sel.mining.resumeButton);
    await expect(startBtn.or(resumeBtn)).toBeVisible();
  });

  // @heavy: the mode cycle rides the most environment-coupled paths in the
  // suite (xmrig restarts, RandomX fast-mode init, dropdown-during-mining
  // interactions). It has caught real product bugs and stays runnable —
  // INCLUDE_HEAVY=1 or a nightly lane — but it does not gate every PR.
  test('start mining and cycle through Eco and Turbo modes @heavy', async ({ appPage: page }) => {
    // Turbo's fast-mode dataset init alone can take minutes; this test's
    // condition waits legitimately sum past the suite default.
    test.setTimeout(600_000);
    await waitForMiningReady(page, 120_000);
    await clickStartMining(page);
    await waitForMiningActive(page, 120_000);

    // There are two mode triggers (mining sidebar + scheduler).
    // Use nth(1) — the second one is in the mining sidebar.
    const modeTrigger = page.locator(sel.mode.trigger).nth(1);

    // Select a mining mode from the dropdown, retrying while options render.
    const selectMode = async (modeName: string) => {
      const option = page.locator(sel.mode.option(modeName));
      const start = Date.now();
      while (Date.now() - start < 30_000) {
        try {
          await modeTrigger.click({ timeout: 10_000 });
        } catch {
          await page.waitForTimeout(1_000);
          continue;
        }
        if (await option.isVisible().catch(() => false)) {
          await option.click({ timeout: 5_000 });
          return;
        }
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1_000);
      }
      throw new Error(`Could not select mining mode: ${modeName}`);
    };

    // --- Eco (default) ---
    await waitForHashrate(page, 120_000);

    // The selected mode persists in config: if the Turbo section fails,
    // restore Eco so later tests don't inherit fast-mode mining.
    try {
      // --- Turbo ---
      await selectMode('Turbo');
      // The miner restarts for the new mode: wait for the stale Eco value
      // to clear so it can't satisfy the Turbo hashrate check.
      await waitForHashrateReset(page, 30_000);
      await waitForMiningActive(page, 60_000);
      // Turbo runs xmrig with randomx-mode=fast: the ~2.3 GB dataset init
      // reports hashrate 0 until it completes, which can take minutes.
      await waitForHashrate(page, 240_000);

      // --- Ludicrous — deliberately not exercised ---
      // Ludicrous requests all cores with randomx-mode=fast, which exceeds
      // CI runner memory (~2 GB per thread for the RandomX dataset). xmrig
      // starts but reports hashrate 0 indefinitely.
    } finally {
      // --- Back to Eco ---
      await selectMode('Eco');
      await waitForMiningActive(page, 60_000).catch(() => {});
    }
    await waitForHashrateReset(page, 30_000).catch(() => {});
    await waitForHashrate(page, 120_000);

    await clickStopMining(page);
    await waitForMiningStopped(page, 60_000);
  });

  test('wallet balance increases from mining', async ({ appPage: page }) => {
    // The balance reflects the WALLET SCAN, which can lag minutes behind
    // the chain tip after a heavy mining session in an earlier test.
    test.setTimeout(600_000);
    await waitForMiningReady(page, 120_000);
    const balanceBefore = await getWalletBalance(page);

    // Mine a burst, stop, then wait for the scan to converge — the
    // scanner can't catch a tip that grows every second (see helper).
    await mineUntilBalanceExceeds(page, Math.floor(balanceBefore) + 1, 300_000);
    const balance = await getWalletBalance(page);
    expect(balance).toBeGreaterThan(balanceBefore);
  });

  test('coinbase transactions appear in the transaction list', async ({ appPage: page }) => {
    test.setTimeout(600_000);
    // Scan-complete FIRST: the balance renders 0 while the wallet is
    // still scanning, so an ensureBalance run now would mine — extending
    // the very scan it then waits on (circular). Once the scan converges
    // on the static tip, the real balance appears and ensureBalance is a
    // no-op (earlier tests in this file mined and confirmed funds).
    await waitForWalletReady(page, 300_000);
    await ensureBalance(page, 1, 180_000);

    // Coinbase rows render as "mined" transactions in the history list.
    const minedRow = page.locator(sel.wallet.txRowMined);
    await minedRow.first().waitFor({ state: 'visible', timeout: 60_000 });
    expect(await minedRow.count()).toBeGreaterThan(0);

    // Verify the first mined row contains a "Block #" title
    const firstTitle = await minedRow.first().textContent();
    expect(firstTitle).toMatch(/Block\s*#\d+/i);
  });

  test('mining recovers after xmrig process is killed', async ({ appPage: page }) => {
    // NOTE: hashrate is NOT a reliable mining signal on localnet — at
    // minimum difficulty xmrig storms submits ("Block not accepted" /
    // "no active pools" churn) and its reported rate reads 0 while the
    // chain grows briskly. Mining evidence = block height increasing;
    // recovery evidence = the watcher writes a NEW pid.
    test.setTimeout(600_000);
    await waitForMiningReady(page, 120_000);
    await clickStartMining(page);
    await waitForMiningActive(page, 120_000);
    await waitForBlockHeightIncrease(page, 120_000);

    // Read the xmrig PID from the PID file written by the process watcher
    const fs = await import('fs');
    const path = await import('path');
    const pidFilePath = path.join(getAppDataDir(), 'xmrig_pid');
    const xmrigPid = parseInt(fs.readFileSync(pidFilePath, 'utf-8').trim(), 10);
    expect(xmrigPid).toBeGreaterThan(0);

    // Kill xmrig
    process.kill(xmrigPid, 'SIGKILL');

    // The process watcher must detect the death and restart the miner —
    // observable as a NEW pid in the pid file.
    const restartDeadline = Date.now() + 120_000;
    let newPid = xmrigPid;
    while (Date.now() < restartDeadline) {
      try {
        newPid = parseInt(fs.readFileSync(pidFilePath, 'utf-8').trim(), 10);
        if (newPid > 0 && newPid !== xmrigPid) break;
      } catch {
        // pid file momentarily absent during the restart
      }
      await page.waitForTimeout(2_000);
    }
    expect(newPid).not.toBe(xmrigPid);

    // And the chain keeps growing under the restarted miner.
    await waitForBlockHeightIncrease(page, 180_000);

    await clickStopMining(page);
    await waitForMiningStopped(page, 60_000);
  });

});
