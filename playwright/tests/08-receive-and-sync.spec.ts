import { test, expect } from '../helpers/fixtures';
import { sel } from '../helpers/selectors';
import { TEST_WALLET } from '../helpers/test-wallet';
import { openSettingsTab } from '../helpers/settings';
import type { Page } from '@playwright/test';

async function readClipboard(page: Page): Promise<string> {
  return page.evaluate(
    () => (window as unknown as { __PLAYWRIGHT_CLIPBOARD__?: string }).__PLAYWRIGHT_CLIPBOARD__ ?? ''
  );
}

test.describe('Receive Flow', () => {
  test('receive modal shows QR, toggles Base58/emoji, and copies the address', async ({ appPage: page }) => {
    // --- Open the Receive modal from the wallet sidebar ---
    const receiveBtn = page.locator(sel.receive.openButton);
    await receiveBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await receiveBtn.click({ timeout: 5_000 });

    await expect(page.getByText(/Receive/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(sel.receive.qr)).toBeVisible({ timeout: 10_000 });

    // --- Base58 by default; the full address rides the title attribute ---
    const address = page.locator(sel.receive.address);
    await address.waitFor({ state: 'visible', timeout: 10_000 });
    await expect(address).toHaveAttribute('title', TEST_WALLET.address, { timeout: 15_000 });

    // --- Copy copies the Base58 address ---
    await page.locator(sel.receive.copyButton).click({ timeout: 5_000 });
    expect(await readClipboard(page)).toBe(TEST_WALLET.address);

    // --- Toggle to the emoji address ---
    const emojiToggle = page.locator(sel.receive.emojiToggle);
    await emojiToggle.locator('..').click({ timeout: 5_000 });
    await expect(emojiToggle).toBeChecked({ timeout: 5_000 });

    const emojiAddress = (await address.getAttribute('title')) ?? '';
    expect(emojiAddress).not.toBe(TEST_WALLET.address);
    expect(emojiAddress.length).toBeGreaterThan(0);
    // Emoji IDs contain no plain alphanumerics.
    expect(emojiAddress).not.toMatch(/[a-zA-Z0-9]/);

    // --- Copy now copies the emoji address ---
    await page.locator(sel.receive.copyButton).click({ timeout: 5_000 });
    expect(await readClipboard(page)).toBe(emojiAddress);

    // --- Toggle back to Base58 ---
    await emojiToggle.locator('..').click({ timeout: 5_000 });
    await expect(address).toHaveAttribute('title', TEST_WALLET.address, { timeout: 10_000 });

    await page.keyboard.press('Escape');
  });
});

test.describe('Sync with Phone (desktop side)', () => {
  test('"I have the app" reveals the QR code and identification code', async ({ appPage: page }) => {
    await openSettingsTab(page, 'wallet');

    await page.locator(sel.settings.syncWithPhone).click({ timeout: 10_000 });
    const haveApp = page.locator(sel.sync.haveApp);
    await haveApp.waitFor({ state: 'visible', timeout: 15_000 });
    await haveApp.click({ timeout: 5_000 });

    // The backend enciphers the seed into a QR + passphrase. No PIN exists
    // at this point in the suite, so no gate should appear.
    await expect(page.locator(sel.sync.qr)).toBeVisible({ timeout: 60_000 });
    const code = page.locator(sel.sync.identificationCode);
    await code.waitFor({ state: 'visible', timeout: 10_000 });
    expect((await code.inputValue()).length).toBeGreaterThan(0);

    await page.keyboard.press('Escape');
  });
});
