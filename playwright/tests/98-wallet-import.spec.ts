import { test, expect } from '../helpers/fixtures';
import { sel } from '../helpers/selectors';
import { TEST_WALLET, SECOND_WALLET } from '../helpers/test-wallet';
import { openSettingsTab } from '../helpers/settings';
import { answerPinPrompt, TEST_PIN } from '../helpers/pin';
import type { Page } from '@playwright/test';

/**
 * Wallet import — runs SECOND-TO-LAST (after 95-security-pin, before
 * 99-shutdown). Importing REPLACES the active wallet and its history, so
 * it must come after every history-dependent test has run on the main
 * TEST_WALLET. It mirrors the handbook's hard rule: import is last.
 *
 * We use the fresh-wallet trick: SECOND_WALLET has a recent birthday so
 * the post-import scan is fast, and no history to evaluate (which is why
 * import runs last — nothing after it needs history).
 *
 * If a PIN was set (it is, when 95 ran first), the import re-enciphers the
 * seed and prompts for it. The prompt is answered opportunistically so the
 * spec also passes when run in isolation with no PIN.
 */
test.describe('Wallet Import', () => {
  test('importing a second wallet switches the active address', async ({ appPage: page }) => {
    test.setTimeout(600_000);
    await openSettingsTab(page, 'wallet');

    // Precondition: the active wallet is the pre-seeded TEST_WALLET.
    const addressInput = page.locator(sel.settings.tariAddress);
    await expect(addressInput).toHaveValue(TEST_WALLET.address, { timeout: 30_000 });

    // --- Enter the second wallet's seed words ---
    await page.locator(sel.settings.seedEdit).click({ timeout: 10_000 });
    const seedInput = page.locator(sel.settings.seedInput);
    await seedInput.waitFor({ state: 'visible', timeout: 10_000 });
    await seedInput.fill(SECOND_WALLET.seedWords.join(' '));

    // The checkmark enables once the 24-word phrase validates.
    const submit = page.locator(sel.settings.seedSubmit);
    await expect(submit).toBeEnabled({ timeout: 10_000 });
    await submit.click({ timeout: 5_000 });

    // --- Confirm the "Import new wallet" dialog ---
    await expect(page.getByText(/Import new wallet/i).first()).toBeVisible({ timeout: 10_000 });
    await page.locator(sel.settings.importConfirm).click({ timeout: 5_000 });

    // Signing the imported seed prompts for the PIN when one is set.
    await answerPinPromptIfShown(page, TEST_PIN);

    // --- The active address becomes the imported wallet's ---
    // Derived from the seed immediately on import (before the scan), so
    // this is the fast, deterministic signal that the import took effect.
    await expect(addressInput).toHaveValue(SECOND_WALLET.address, { timeout: 180_000 });

    // The Receive modal reads the address straight from the store — confirm
    // it reflects the imported wallet there too (and is no longer the old
    // one).
    await page.keyboard.press('Escape');
    const receiveBtn = page.locator(sel.receive.openButton);
    await receiveBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await receiveBtn.click({ timeout: 5_000 });
    const receiveAddress = page.locator(sel.receive.address);
    await expect(receiveAddress).toHaveAttribute('title', SECOND_WALLET.address, { timeout: 30_000 });
    expect(await receiveAddress.getAttribute('title')).not.toBe(TEST_WALLET.address);
  });
});

/**
 * Answer the PIN prompt if it appears within a short window; otherwise
 * assume no PIN is set and move on. Keeps the spec valid both in the full
 * suite (PIN set by 95) and when run alone.
 */
async function answerPinPromptIfShown(page: Page, pin: string) {
  const shown = await page
    .locator(sel.pin.input)
    .waitFor({ state: 'visible', timeout: 15_000 })
    .then(
      () => true,
      () => false
    );
  if (shown) await answerPinPrompt(page, pin);
}
