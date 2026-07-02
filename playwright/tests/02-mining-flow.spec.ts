import { test, expect } from '../helpers/fixtures';
import {
  waitForMiningReady,
  clickStartMining,
  waitForMiningActive,
  clickStopMining,
  waitForMiningStopped,
  getWalletBalance,
  waitForWalletBalance,
  ensureBalance,
} from '../helpers/wait-for';
import { sel } from '../helpers/selectors';
import { getAppDataDir } from '../helpers/app-dirs';
import type { Page } from '@playwright/test';

/** Wait for a real hashrate (e.g. "1.2 kH/s") to render in the CPU tile. */
async function waitForHashrate(page: Page, timeout = 60_000) {
  const cpuTile = page.locator(sel.mining.tileCpu);
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const text = await cpuTile.textContent({ timeout: 2_000 }).catch(() => '');
    if (/[HGMk]\/s/.test(text ?? '') && !/\.\.\./.test(text ?? '')) return;
    await page.waitForTimeout(1_000);
  }
  throw new Error(`Hashrate did not appear within ${timeout}ms`);
}

/**
 * Wait for the CPU tile to STOP showing a hashrate. Used after a mode
 * change: the tile keeps the previous session's value until the miner
 * restart propagates, so waiting for reset first prevents a stale value
 * from satisfying the next waitForHashrate.
 */
async function waitForHashrateReset(page: Page, timeout = 30_000) {
  const cpuTile = page.locator(sel.mining.tileCpu);
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const text = await cpuTile.textContent({ timeout: 2_000 }).catch(() => '');
    if (!/[HGMk]\/s/.test(text ?? '') || /\.\.\./.test(text ?? '')) return;
    await page.waitForTimeout(1_000);
  }
  throw new Error(`Hashrate did not reset within ${timeout}ms`);
}

async function hasHashrate(page: Page): Promise<boolean> {
  const text = await page
    .locator(sel.mining.tileCpu)
    .textContent({ timeout: 2_000 })
    .catch(() => '');
  return /[HGMk]\/s/.test(text ?? '') && !/\.\.\./.test(text ?? '');
}

test.describe('Mining Flow', () => {
  test('app launches and mining controls become ready', async ({ appPage: page }) => {
    await waitForMiningReady(page, 120_000);
    const startBtn = page.locator(sel.mining.startButton);
    const resumeBtn = page.locator(sel.mining.resumeButton);
    await expect(startBtn.or(resumeBtn)).toBeVisible();
  });

  test('start mining and cycle through Eco and Turbo modes', async ({ appPage: page }) => {
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
    await waitForHashrate(page, 30_000);

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
    await waitForMiningReady(page, 120_000);
    const balanceBefore = await getWalletBalance(page);

    // Mine until the balance visibly exceeds where we started, then stop.
    // Condition-based: no fixed mining duration.
    await clickStartMining(page);
    await waitForMiningActive(page, 120_000);
    let balance: number;
    try {
      balance = await waitForWalletBalance(page, Math.floor(balanceBefore) + 1, 180_000);
    } finally {
      await clickStopMining(page);
      await waitForMiningStopped(page, 60_000);
    }
    expect(balance).toBeGreaterThan(balanceBefore);
  });

  test('mining recovers after xmrig process is killed', async ({ appPage: page }) => {
    await waitForMiningReady(page, 120_000);
    await clickStartMining(page);
    await waitForMiningActive(page, 120_000);
    await waitForHashrate(page, 30_000);

    // Read the xmrig PID from the PID file written by the process watcher
    const fs = await import('fs');
    const path = await import('path');
    const pidFilePath = path.join(getAppDataDir(), 'xmrig_pid');
    const xmrigPid = parseInt(fs.readFileSync(pidFilePath, 'utf-8').trim(), 10);
    expect(xmrigPid).toBeGreaterThan(0);

    // Kill xmrig
    process.kill(xmrigPid, 'SIGKILL');

    // Wait for the hashrate to disappear (process is dead)
    const deadStart = Date.now();
    while (Date.now() - deadStart < 15_000) {
      if (!(await hasHashrate(page))) break;
      await page.waitForTimeout(1_000);
    }

    // Now wait for the hashrate to come back (process watcher restarts xmrig)
    const recoveryStart = Date.now();
    while (Date.now() - recoveryStart < 120_000) {
      if (await hasHashrate(page)) break;
      await page.waitForTimeout(2_000);
    }
    expect(await hasHashrate(page)).toBe(true);

    await clickStopMining(page);
    await waitForMiningStopped(page, 60_000);
  });

  test('coinbase transactions appear in the transaction list', async ({ appPage: page }) => {
    // Self-sufficient: mine if this run hasn't produced a balance yet.
    await ensureBalance(page, 1, 180_000);

    // Coinbase rows render as "mined" transactions in the history list.
    const minedRow = page.locator(sel.wallet.txRowMined);
    await minedRow.first().waitFor({ state: 'visible', timeout: 60_000 });
    expect(await minedRow.count()).toBeGreaterThan(0);

    // Verify the first mined row contains a "Block #" title
    const firstTitle = await minedRow.first().textContent();
    expect(firstTitle).toMatch(/Block\s*#\d+/i);
  });
});
