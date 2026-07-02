import { test, expect } from '../helpers/fixtures';
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

/**
 * Exchange miner flow. The backend's wallet mode is genuinely sequential
 * state (internal → exchange → internal), so this file is an explicit
 * serial chain: a failure in one step skips the rest instead of cascading
 * into confusing downstream failures. Each step still gets a fresh page
 * via the fixture — only the BACKEND state carries across steps.
 */
test.describe.serial('Exchange Miner', () => {
  let balanceBeforeExchange = 0;

  test('copy wallet address and switch to exchange mining', async ({ appPage: page }) => {
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

    // --- Select a test exchange that accepts Tari addresses ---
    const allOptions = page.locator('[data-testid^="exchange-option-"]');
    await allOptions.first().waitFor({ state: 'visible', timeout: 10_000 });
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

    // --- Enter the wallet's own address ---
    const addressInput = page.locator(sel.exchange.addressInput);
    await addressInput.waitFor({ state: 'visible', timeout: 5_000 });
    await addressInput.fill(walletAddress);

    // Wait for validation and click confirm
    const confirmBtn = page.locator(sel.exchange.confirm);
    await confirmBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await confirmBtn.click({ timeout: 10_000 });

    // --- The backend restarts phases (wallet shutdown, miner restart).
    // The WS may drop but the shim auto-reconnects; the state replay
    // repopulates the store on reconnect. Wait for the UI to reflect
    // exchange mode: WalletBalanceHidden renders with data-mode="exchange".
    const balanceEl = page.locator(`${sel.wallet.balance}[data-mode="exchange"]`);
    await balanceEl.waitFor({ state: 'visible', timeout: 180_000 });

    // Verify the exchange name appears on the wallet card
    const exchangeName = page.getByText(/TARI.*FAKE.*Exchange/i).first();
    await expect(exchangeName).toBeVisible({ timeout: 10_000 });
  });

  test('mining works in exchange mode', async ({ appPage: page }) => {
    await waitForMiningReady(page, 120_000);
    await clickStartMining(page);
    await waitForMiningActive(page, 120_000);

    // Verify hashrate appears
    const cpuTile = page.locator(sel.mining.tileCpu);
    const start = Date.now();
    let sawHashrate = false;
    while (Date.now() - start < 60_000) {
      const text = await cpuTile.textContent({ timeout: 2_000 }).catch(() => '');
      if (/[HGMk]\/s/.test(text ?? '') && !/\.\.\./.test(text ?? '')) {
        sawHashrate = true;
        break;
      }
      await page.waitForTimeout(1_000);
    }
    expect(sawHashrate).toBe(true);

    await clickStopMining(page);
    await waitForMiningStopped(page, 60_000);
  });

  test('switch back to Tari Universe wallet and verify balance', async ({ appPage: page }) => {
    // Revert via the exchange modal: select the internal wallet option.
    const exchangeBtn = page.locator(sel.exchange.mineButton);
    const internalOption = page.locator(sel.exchange.optionUniversal);
    let revertedViaUi = false;
    const becomesVisible = (locator: ReturnType<typeof page.locator>, timeout: number) =>
      locator.waitFor({ state: 'visible', timeout }).then(() => true, () => false);
    if (await becomesVisible(exchangeBtn, 10_000)) {
      await exchangeBtn.click({ timeout: 5_000 });
      if (await becomesVisible(internalOption, 5_000)) {
        await internalOption.click({ timeout: 5_000 });
        const revertConfirm = page.locator(sel.exchange.revertConfirm);
        if (await becomesVisible(revertConfirm, 5_000)) {
          await revertConfirm.click({ timeout: 5_000 });
          revertedViaUi = true;
        }
      }
      if (!revertedViaUi) {
        await page.keyboard.press('Escape');
      }
    }
    if (!revertedViaUi) {
      // Fallback: revert via invoke — the exchange modal UI does not
      // always expose the internal-wallet option in exchange mode.
      await page.evaluate(async () => {
        const fn = (window as any).__PLAYWRIGHT_INVOKE__;
        if (typeof fn === 'function') {
          await fn('revert_to_internal_wallet', {});
        }
      }).catch(() => { /* invoke may fail if WS drops during revert */ });
    }

    // Backend restarts wallet phases; WS auto-reconnects and the state
    // replay repopulates the store. Wait for the real balance to return.
    // The normal WalletBalance has data-balance-total; the hidden one has
    // data-mode="exchange".
    const normalBalance = page.locator(`${sel.wallet.balance}:not([data-mode])`);
    const start = Date.now();
    while (Date.now() - start < 180_000) {
      try {
        if (await normalBalance.isVisible().catch(() => false)) {
          const attr = await normalBalance
            .getAttribute('data-balance-total', { timeout: 2_000 })
            .catch(() => null);
          if (attr && parseFloat(attr) > 0) break;
        }
      } catch {
        /* WS reconnecting */
      }
      await page.waitForTimeout(3_000);
    }

    const balanceAfter = await getWalletBalance(page);
    expect(balanceAfter).toBeGreaterThanOrEqual(balanceBeforeExchange);
  });

  test('mining works after switching back to wallet', async ({ appPage: page }) => {
    await waitForMiningReady(page, 120_000);

    const balanceBefore = await getWalletBalance(page);

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
});
