import { test, expect } from '../helpers/shared-context';
import {
  waitForMiningReady,
  clickStartMining,
  waitForMiningActive,
  clickStopMining,
  waitForMiningStopped,
  getWalletBalance,
  waitForWalletBalance,
} from '../helpers/wait-for';
import { sel } from '../helpers/selectors';

test.describe('Exchange Miner', () => {
  let balanceBeforeExchange = 0;

  test('copy wallet address and switch to exchange mining', async ({ sharedPage: page }) => {
    await waitForMiningReady(page, 120_000);

    // --- Copy the wallet's own address via the UI copy button ---
    const copyBtn = page.locator(sel.copyAddress);
    await copyBtn.waitFor({ state: 'visible', timeout: 30_000 });
    await copyBtn.click({ timeout: 5_000 });

    const walletAddress = await page.evaluate(() => {
      return (window as any).__PLAYWRIGHT_CLIPBOARD__ || '';
    });
    expect(walletAddress.length).toBeGreaterThan(0);

    // Record balance before switching
    balanceBeforeExchange = await getWalletBalance(page);

    // --- Click "Mine directly to an exchange" ---
    const exchangeBtn = page.locator(sel.exchange.mineButton);
    await exchangeBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await exchangeBtn.click({ timeout: 5_000 });
    await page.waitForTimeout(2_000);

    // --- Select a test exchange that accepts Tari addresses ---
    const allOptions = page.locator('[data-testid^="exchange-option-"]');
    const optionCount = await allOptions.count();
    let exchangeOption = null;
    for (let i = 0; i < optionCount; i++) {
      const testid = await allOptions.nth(i).getAttribute('data-testid');
      const text = await allOptions.nth(i).textContent();
      if (testid && !testid.includes('universal') && !(text ?? '').toLowerCase().includes('wxtm')) {
        exchangeOption = allOptions.nth(i);
        break;
      }
    }
    // Fall back to any non-universal exchange
    if (!exchangeOption) {
      for (let i = 0; i < optionCount; i++) {
        const testid = await allOptions.nth(i).getAttribute('data-testid');
        if (testid && !testid.includes('universal')) {
          exchangeOption = allOptions.nth(i);
          break;
        }
      }
    }
    expect(exchangeOption).not.toBeNull();

    // Expand the exchange option
    await exchangeOption!.click({ timeout: 5_000 });
    await page.waitForTimeout(1_000);

    // --- Enter the wallet's own address ---
    const addressInput = page.locator(sel.exchange.addressInput);
    await addressInput.waitFor({ state: 'visible', timeout: 5_000 });
    await addressInput.fill(walletAddress);

    // Wait for validation and click confirm
    const confirmBtn = page.locator(sel.exchange.confirm);
    await confirmBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await confirmBtn.click({ timeout: 10_000 });

    // --- The backend restarts phases (wallet shutdown, miner restart).
    // The WS may drop but the shim auto-reconnects. Stay on the same
    // page and wait for the UI to reflect exchange mode. ---
    // In exchange mode, WalletBalanceHidden renders with data-mode="exchange"
    const balanceEl = page.locator(`${sel.wallet.balance}[data-mode="exchange"]`);
    const start = Date.now();
    let switchedToExchange = false;
    while (Date.now() - start < 180_000) {
      try {
        if (await balanceEl.isVisible().catch(() => false)) {
          switchedToExchange = true;
          break;
        }
      } catch { /* WS reconnecting */ }
      await new Promise(r => setTimeout(r, 3_000));
    }
    expect(switchedToExchange).toBe(true);

    // Verify the exchange name appears on the wallet card
    const exchangeName = page.getByText(/TARI.*FAKE.*Exchange/i).first();
    await expect(exchangeName).toBeVisible({ timeout: 10_000 });
  });

  test('mining works in exchange mode', async ({ sharedPage: page }) => {
    await waitForMiningReady(page, 120_000);
    await clickStartMining(page);
    await waitForMiningActive(page, 120_000);

    // Verify hashrate appears
    const cpuTile = page.locator(sel.mining.tileCpu);
    const start = Date.now();
    while (Date.now() - start < 60_000) {
      const text = await cpuTile.textContent({ timeout: 2_000 }).catch(() => '');
      if (/[HGMk]\/s/.test(text ?? '') && !/\.\.\./.test(text ?? '')) break;
      await page.waitForTimeout(1_000);
    }

    await page.waitForTimeout(5_000);
    await clickStopMining(page);
    await waitForMiningStopped(page, 60_000);
  });

  test('switch back to Tari Universe wallet and verify balance', async ({ sharedPage: page }) => {
    // Use invoke to revert — the exchange modal UI in exchange mode
    // may not have the "Mine directly to exchange" button visible.
    await page.evaluate(async () => {
      const fn = (window as any).__PLAYWRIGHT_INVOKE__;
      if (typeof fn === 'function') {
        await fn('revert_to_internal_wallet', {});
      }
    }).catch(() => { /* invoke may fail if WS drops during revert */ });

    // Backend restarts wallet phases. The WS may drop but auto-reconnects.
    // Stay on the same page and wait for the real balance to come back.
    // The normal WalletBalance has data-balance-total, the hidden one has data-mode="exchange".
    const normalBalance = page.locator(`${sel.wallet.balance}:not([data-mode])`);
    const start = Date.now();
    while (Date.now() - start < 180_000) {
      try {
        if (await normalBalance.isVisible().catch(() => false)) {
          const attr = await normalBalance.getAttribute('data-balance-total', { timeout: 2_000 }).catch(() => null);
          if (attr && parseFloat(attr) > 0) break;
        }
      } catch { /* WS reconnecting */ }
      await new Promise(r => setTimeout(r, 3_000));
    }

    const balanceAfter = await getWalletBalance(page);
    expect(balanceAfter).toBeGreaterThanOrEqual(balanceBeforeExchange);
  });

  test('mining works after switching back to wallet', async ({ sharedPage: page }) => {
    await waitForMiningReady(page, 120_000);

    const balanceBefore = await getWalletBalance(page);

    await clickStartMining(page);
    await waitForMiningActive(page, 120_000);
    await page.waitForTimeout(10_000);
    await clickStopMining(page);
    await waitForMiningStopped(page, 60_000);

    // Wait for wallet scan to pick up new blocks
    const balance = await waitForWalletBalance(page, Math.floor(balanceBefore) + 1, 120_000);
    expect(balance).toBeGreaterThan(balanceBefore);
  });
});
