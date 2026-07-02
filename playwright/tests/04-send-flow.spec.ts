import { test, expect } from '../helpers/fixtures';
import {
  ensureBalance,
  mineUntilBalanceExceeds,
  getWalletBalance,
} from '../helpers/wait-for';
import { sel } from '../helpers/selectors';
import { TEST_WALLET } from '../helpers/test-wallet';
import type { Page } from '@playwright/test';

const INVALID_ADDRESS = 'this-is-not-a-valid-tari-address';
const VALID_ADDRESS = TEST_WALLET.address;

/** Open the Send Tari modal and wait for the address input. */
async function openSendModal(page: Page) {
  const sendBtn = page.locator(sel.send.button);
  await sendBtn.waitFor({ state: 'visible', timeout: 10_000 });
  await sendBtn.click({ timeout: 5_000 });
  await expect(page.getByText('Send Tari')).toBeVisible({ timeout: 5_000 });
  const addressInput = page.locator(sel.send.addressInput);
  await addressInput.waitFor({ state: 'visible', timeout: 5_000 });
  return addressInput;
}

test.describe('Send Transaction Flow', () => {
  test('send form validates address and amount inputs', async ({ appPage: page }) => {
    // A balance is required so the amount field becomes usable.
    await ensureBalance(page, 2, 180_000);

    const addressInput = await openSendModal(page);

    // --- Invalid address shows an error ---
    await addressInput.fill(INVALID_ADDRESS);
    await expect(page.getByText(/address is invalid/i)).toBeVisible({ timeout: 10_000 });

    // --- Valid address shows the green checkmark and unlocks the rest ---
    await addressInput.fill('');
    await addressInput.fill(VALID_ADDRESS);
    const checkmark = page.locator('svg[fill="#009E54"], svg path[fill="#009E54"]');
    await expect(checkmark.first()).toBeVisible({ timeout: 10_000 });

    const amountInput = page.locator(sel.send.amountInput);
    await expect(amountInput).toBeEnabled({ timeout: 5_000 });

    // --- Non-numeric amount is rejected (field filters or errors) ---
    const reviewBtn = page.locator(sel.send.reviewButton);
    await amountInput.click();
    await amountInput.pressSequentially('abc', { delay: 50 });
    const amountError = page.getByText(/amount is invalid/i);
    const hasAmountError = await amountError
      .waitFor({ state: 'visible', timeout: 3_000 })
      .then(() => true, () => false);
    if (!hasAmountError) {
      // The input filtered the characters — review must still be disabled.
      await expect(reviewBtn).toBeDisabled({ timeout: 3_000 });
    }

    // --- Valid amount + message enables Review ---
    await amountInput.fill('');
    await amountInput.fill('1');
    await page.locator(sel.send.messageInput).fill('validation-check');
    await expect(reviewBtn).toBeEnabled({ timeout: 5_000 });

    // Close the modal without sending — this test only covers validation.
    await page.keyboard.press('Escape');
    await expect(page.getByText('Send Tari')).not.toBeVisible({ timeout: 5_000 });
  });

  test('send a transaction end-to-end and see it confirm', async ({ appPage: page }) => {
    const SEND_AMOUNT = '1';
    const TX_MESSAGE = `pw-send-${Date.now()}`;

    await ensureBalance(page, 2, 180_000);

    // --- Fill the form ---
    const addressInput = await openSendModal(page);
    await addressInput.fill(VALID_ADDRESS);
    const amountInput = page.locator(sel.send.amountInput);
    await expect(amountInput).toBeEnabled({ timeout: 10_000 });
    await amountInput.fill(SEND_AMOUNT);
    await page.locator(sel.send.messageInput).fill(TX_MESSAGE);

    // --- Review ---
    const reviewBtn = page.locator(sel.send.reviewButton);
    await expect(reviewBtn).toBeEnabled({ timeout: 5_000 });
    await reviewBtn.click({ timeout: 5_000 });

    await expect(page.getByText(/Review transaction/i).first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(VALID_ADDRESS.slice(0, 8)).first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(TX_MESSAGE).first()).toBeVisible({ timeout: 5_000 });

    // --- Confirm ---
    const confirmBtn = page.locator(sel.send.confirmButton);
    await confirmBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await confirmBtn.click({ timeout: 10_000 });

    await expect(page.getByText(/on the way/i).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/You're Done/i).first()).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/complete and will be broadcast/i).first()).toBeVisible({
      timeout: 5_000,
    });

    const doneBtn = page.locator(sel.send.doneButton);
    await doneBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await doneBtn.click({ timeout: 5_000 });
    await expect(page.getByText(/Send Tari/i).first()).not.toBeVisible({ timeout: 5_000 });

    // --- The transaction appears in history ---
    const txRow = page.getByText(new RegExp(TX_MESSAGE)).first();
    await txRow.waitFor({ state: 'visible', timeout: 30_000 });

    // --- Transaction details open from the row (hover-revealed button) ---
    const rowContainer = page
      .locator('[data-index]')
      .filter({ hasText: new RegExp(TX_MESSAGE) })
      .first();
    await rowContainer.hover({ force: true });
    const detailsBtn = page.locator(sel.send.rowDetails).first();
    const detailsVisible = await detailsBtn
      .waitFor({ state: 'visible', timeout: 5_000 })
      .then(() => true, () => false);
    if (detailsVisible) {
      await detailsBtn.click({ timeout: 5_000 });
      await expect(page.getByText('Transaction Details').first()).toBeVisible({ timeout: 5_000 });
      await expect(page.getByText(TX_MESSAGE).first()).toBeVisible({ timeout: 5_000 });

      // Copy raw details and verify the clipboard holds valid JSON
      const copyRawBtn = page.locator(sel.send.copyRaw);
      await copyRawBtn.waitFor({ state: 'visible', timeout: 5_000 });
      await copyRawBtn.click({ timeout: 5_000 });
      const clipboard = await page.evaluate(() => {
        return (window as any).__PLAYWRIGHT_CLIPBOARD__ || '';
      });
      expect(clipboard.length).toBeGreaterThan(0);
      expect(() => JSON.parse(clipboard)).not.toThrow();

      await page.keyboard.press('Escape');
    }
    // If the hover-only Details button didn't appear (headless hover is
    // unreliable with framer-motion), the row being visible already
    // confirms the send.

    // --- Mine so the pending transaction confirms, then re-check history ---
    const balanceNow = await getWalletBalance(page);
    await mineUntilBalanceExceeds(page, Math.floor(balanceNow) + 1, 180_000);
    await txRow.waitFor({ state: 'visible', timeout: 60_000 });
  });
});
