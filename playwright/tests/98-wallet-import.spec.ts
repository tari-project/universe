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

    // Signing the imported seed prompts for the PIN when one is set — but
    // import_seed_words runs shutdown_phases FIRST, so the prompt can arrive
    // tens of seconds after the confirm click, not immediately.
    await answerImportPin(page, TEST_PIN, addressInput);

    // --- The active address becomes the imported wallet's ---
    // Derived from the seed immediately on import (before the scan), so
    // this is the fast, deterministic signal that the import took effect:
    // it is no longer TEST_WALLET, and it is exactly the second wallet's
    // address the app derives from the imported seed. (The settings field
    // and the Receive modal read the same store value, so this one
    // assertion covers "the emoji/base58 address updates to the imported
    // wallet" without depending on the wallet sidebar's post-import
    // re-init state.)
    await expect(addressInput).not.toHaveValue(TEST_WALLET.address, { timeout: 180_000 });
    await expect(addressInput).toHaveValue(SECOND_WALLET.address, { timeout: 30_000 });
  });
});

/**
 * Answer the PIN prompt raised during import. The gate only appears after
 * import_seed_words has torn down the wallet/mining phases, so it can lag
 * the confirm click by tens of seconds — poll for it generously. If instead
 * the address switches first (no PIN set, e.g. running this spec alone),
 * the import already completed and there is nothing to answer.
 */
async function answerImportPin(page: Page, pin: string, addressInput: ReturnType<Page['locator']>) {
  const pinInput = page.locator(sel.pin.input);
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (await pinInput.isVisible().catch(() => false)) {
      await answerPinPrompt(page, pin);
      return;
    }
    const value = await addressInput.inputValue().catch(() => '');
    if (value && value !== TEST_WALLET.address) return; // imported without a PIN
    await page.waitForTimeout(1_000);
  }
}
