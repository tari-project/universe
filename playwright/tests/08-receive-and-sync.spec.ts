import { test, expect } from '../helpers/fixtures';
import { sel } from '../helpers/selectors';
import { TEST_WALLET } from '../helpers/test-wallet';
import { openSettingsTab, setToggleState } from '../helpers/settings';
import type { Page } from '@playwright/test';

async function readClipboard(page: Page): Promise<string> {
  return page.evaluate(
    () => (window as unknown as { __PLAYWRIGHT_CLIPBOARD__?: string }).__PLAYWRIGHT_CLIPBOARD__ ?? ''
  );
}

/**
 * Click a Copy button and converge on the clipboard holding `expected`. The
 * clipboard is a shared buffer that keeps its previous value, so a lost
 * click would leave a stale (wrong) value and either false-pass or
 * false-fail — re-click until it reads exactly the expected string.
 */
async function copyUntil(page: Page, buttonSelector: string, expected: string, timeout = 15_000) {
  await expect
    .poll(
      async () => {
        await page
          .locator(buttonSelector)
          .click({ timeout: 5_000, force: true })
          .catch(() => {});
        return readClipboard(page);
      },
      { timeout, intervals: [400, 800, 800, 1000] }
    )
    .toBe(expected);
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
    await copyUntil(page, sel.receive.copyButton, TEST_WALLET.address);

    // --- Toggle to the emoji address (converge on the flip) ---
    const emojiToggle = page.locator(sel.receive.emojiToggle);
    await setToggleState(page, sel.receive.emojiToggle, true);

    const emojiAddress = (await address.getAttribute('title')) ?? '';
    expect(emojiAddress).not.toBe(TEST_WALLET.address);
    expect(emojiAddress.length).toBeGreaterThan(0);
    // Emoji IDs contain no plain alphanumerics.
    expect(emojiAddress).not.toMatch(/[a-zA-Z0-9]/);

    // --- Copy now copies the emoji address ---
    await copyUntil(page, sel.receive.copyButton, emojiAddress);

    // --- Toggle back to Base58 ---
    await setToggleState(page, sel.receive.emojiToggle, false);
    await expect(address).toHaveAttribute('title', TEST_WALLET.address, { timeout: 10_000 });

    await page.keyboard.press('Escape');
  });
});
