import { test, expect } from '../helpers/fixtures';
import { sel } from '../helpers/selectors';
import { TEST_WALLET } from '../helpers/test-wallet';
import type { Page } from '@playwright/test';

/**
 * Wallet integrity tests — validate that the pre-seeded wallet vault
 * produces the expected address and seed words.
 *
 * The global setup writes a known credential file (the "vault") and
 * wallet config to disk before the app starts. If a new binary version
 * corrupts, regenerates, or loses the wallet, these assertions fail.
 *
 * Each test opens its own fresh page and navigates to Settings → Wallet
 * itself — no dependence on another test leaving the panel open.
 */

async function openWalletSettings(page: Page) {
  await page.locator(sel.settings.open).click({ timeout: 5_000 });
  await page.locator(sel.settings.walletTab).click({ timeout: 5_000 });
}

test.describe('Wallet Integrity', () => {
  test('seed words displayed in settings match the pre-seeded vault', async ({ appPage: page }) => {
    await openWalletSettings(page);

    // Click the eye icon to reveal seed words.
    // This triggers invoke('get_seed_words') on the backend which:
    //   1. Reads the encrypted seed from the file-backed credential store
    //   2. Deserializes the CipherSeed
    //   3. Converts to mnemonic words
    // If the vault is corrupted or the binary handles seeds differently,
    // this will return different words (or fail entirely).
    const seedToggle = page.locator(sel.settings.seedToggle).first();
    await seedToggle.waitFor({ state: 'visible', timeout: 10_000 });
    await seedToggle.click({ timeout: 5_000 });

    // Wait for seed words to load from backend and render
    const seedDisplay = page.locator(sel.settings.seedWordsDisplay).first();

    // Poll until we see actual words (not just the toggle button)
    const start = Date.now();
    let words: string[] = [];
    while (Date.now() - start < 30_000) {
      const seedText = await seedDisplay.textContent({ timeout: 5_000 }).catch(() => '');
      // Parse "1.park2.visit..." or "1. park 2. visit ..." format
      words = (seedText ?? '')
        .split(/\d+\./)
        .map((w) => w.trim())
        .filter((w) => w.length > 0);
      if (words.length === 24) break;
      await page.waitForTimeout(1_000);
    }

    expect(words).toEqual(TEST_WALLET.seedWords);
  });

  test('wallet address matches the pre-seeded vault', async ({ appPage: page }) => {
    await openWalletSettings(page);

    // The address input is populated from useWalletStore.tari_address_base58,
    // set by the SelectedTariAddressChanged event. The headless state replay
    // delivers it to every fresh page, so the input MUST show the fixture
    // address — an empty input is a real failure, not a timing quirk.
    const addressInput = page.locator(sel.settings.tariAddress);
    await addressInput.waitFor({ state: 'visible', timeout: 10_000 });

    await expect(addressInput).toHaveValue(TEST_WALLET.address, { timeout: 30_000 });
  });
});
