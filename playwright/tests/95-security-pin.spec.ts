import { test, expect } from '../helpers/fixtures';
import { sel } from '../helpers/selectors';
import { TEST_WALLET } from '../helpers/test-wallet';
import { openSettingsTab } from '../helpers/settings';
import { enterPinDigits, answerPinPrompt, TEST_PIN, WRONG_PIN } from '../helpers/pin';
import { ensureBalance } from '../helpers/wait-for';
import { McpClient } from '../helpers/mcp-client';
import type { Page } from '@playwright/test';

/**
 * Security PIN — runs LAST in the suite (file naming keeps it last;
 * workers: 1). Setting the PIN is IRREVERSIBLE for the profile, exactly
 * like production: every earlier spec exercises the no-PIN paths, this
 * spec sets the PIN once and then verifies each PIN *delta* (the gates),
 * mirroring the handbook's hard ordering rule.
 *
 * Serial: later tests depend on the PIN (and the MCP token) existing.
 */
test.describe.serial('Security PIN', () => {
  let mcpToken = '';

  async function openSendModal(page: Page) {
    const sendBtn = page.locator(sel.send.button);
    await sendBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await sendBtn.click({ timeout: 5_000 });
    await page.locator(sel.send.addressInput).waitFor({ state: 'visible', timeout: 10_000 });
  }

  /** Fill the address until backend validation shows the green check. */
  async function fillValidAddress(page: Page, timeout = 120_000) {
    const addressInput = page.locator(sel.send.addressInput);
    const valid = page.locator('svg[fill="#009E54"], svg path[fill="#009E54"]').first();
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      await addressInput.fill('');
      await addressInput.fill(TEST_WALLET.address);
      const ok = await valid.waitFor({ state: 'visible', timeout: 10_000 }).then(
        () => true,
        () => false
      );
      if (ok) return;
    }
    throw new Error(`Address validation did not resolve within ${timeout}ms`);
  }

  test('stage funds while the wallet is still PIN-free', async ({ appPage: page }) => {
    test.setTimeout(600_000);
    // The send-gate and MCP-approval tests below need spendable funds;
    // mining first keeps every later test focused on its PIN delta.
    await ensureBalance(page, 3, 300_000);
  });

  test('create the PIN, with confirm-mismatch validation', async ({ appPage: page }) => {
    await openSettingsTab(page, 'wallet');
    await page.locator(sel.settings.setupPin).click({ timeout: 10_000 });

    // --- Create step ---
    await expect(page.getByText('Create your Wallet PIN').first()).toBeVisible({ timeout: 15_000 });
    await enterPinDigits(page, TEST_PIN);
    await page.locator(sel.pin.createSubmit).click({ timeout: 5_000 });

    // --- Confirm step: a wrong PIN is caught inline ---
    await expect(page.getByText('Confirm your PIN').first()).toBeVisible({ timeout: 10_000 });
    await enterPinDigits(page, WRONG_PIN);
    await expect(page.locator(sel.pin.error)).toBeVisible({ timeout: 5_000 });
    await expect(page.locator(sel.pin.createSubmit)).toBeDisabled();

    // --- "Enter a new PIN" returns to the create step ---
    await page.locator(sel.pin.createSecondary).click({ timeout: 5_000 });
    await expect(page.getByText('Create your Wallet PIN').first()).toBeVisible({ timeout: 10_000 });

    // --- Create + confirm correctly ---
    await enterPinDigits(page, TEST_PIN);
    await page.locator(sel.pin.createSubmit).click({ timeout: 5_000 });
    await expect(page.getByText('Confirm your PIN').first()).toBeVisible({ timeout: 10_000 });
    await enterPinDigits(page, TEST_PIN);
    await page.locator(sel.pin.createSubmit).click({ timeout: 5_000 });

    // --- Done ---
    await expect(page.getByText(/all done/i).first()).toBeVisible({ timeout: 15_000 });
    await page.getByText('Continue to Tari Universe').first().click({ timeout: 5_000 });

    // The setup section disappears once a PIN exists. Creating the PIN
    // re-encrypts the seed (argon2) — allow it real time.
    await openSettingsTab(page, 'wallet');
    await expect(page.locator(sel.settings.setupPin)).not.toBeVisible({ timeout: 60_000 });
  });

  test('seed words are PIN-gated: wrong PIN keeps them hidden', async ({ appPage: page }) => {
    await openSettingsTab(page, 'wallet');
    const seedToggle = page.locator(sel.settings.seedToggle).first();
    const seedDisplay = page.locator(sel.settings.seedWordsDisplay).first();

    // --- Wrong PIN: prompt closes, seed words stay hidden ---
    await seedToggle.click({ timeout: 5_000 });
    await page.locator(sel.pin.input).waitFor({ state: 'visible', timeout: 15_000 });
    await answerPinPrompt(page, WRONG_PIN);
    await page.waitForTimeout(2_000);
    expect(await seedDisplay.textContent()).toContain('*');

    // --- Correct PIN: seed words reveal and match the vault ---
    await seedToggle.click({ timeout: 5_000 });
    await page.locator(sel.pin.input).waitFor({ state: 'visible', timeout: 15_000 });
    await answerPinPrompt(page, TEST_PIN);

    await expect
      .poll(
        async () => {
          const text = (await seedDisplay.textContent().catch(() => '')) ?? '';
          return text
            .split(/\d+\./)
            .map((w) => w.trim())
            .filter((w) => w.length > 0);
        },
        { timeout: 30_000 }
      )
      .toEqual(TEST_WALLET.seedWords);
  });

  test('send prompts for the PIN before broadcasting', async ({ appPage: page }) => {
    test.setTimeout(600_000);
    await ensureBalance(page, 2, 300_000);

    await openSendModal(page);
    await fillValidAddress(page);
    const amountInput = page.locator(sel.send.amountInput);
    await expect(amountInput).toBeEnabled({ timeout: 10_000 });
    await amountInput.fill('1');
    await page.locator(sel.send.messageInput).fill(`pw-pin-send-${Date.now()}`);

    const reviewBtn = page.locator(sel.send.reviewButton);
    await expect(reviewBtn).toBeEnabled({ timeout: 5_000 });
    await reviewBtn.click({ timeout: 5_000 });

    const confirmBtn = page.locator(sel.send.confirmButton);
    await confirmBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await confirmBtn.click({ timeout: 10_000 });

    // The PIN delta: signing now demands the PIN.
    await page.locator(sel.pin.input).waitFor({ state: 'visible', timeout: 30_000 });
    await answerPinPrompt(page, TEST_PIN);

    // The rest of the flow is unchanged from 04 — confirm it completes.
    await expect(page.getByText(/on the way/i).first()).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/You're Done/i).first()).toBeVisible({ timeout: 60_000 });
    const doneBtn = page.locator(sel.send.doneButton);
    await doneBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await doneBtn.click({ timeout: 5_000 });
  });

  test('sync with phone prompts for the PIN before showing the QR', async ({ appPage: page }) => {
    await openSettingsTab(page, 'wallet');
    await page.locator(sel.settings.syncWithPhone).click({ timeout: 10_000 });
    const haveApp = page.locator(sel.sync.haveApp);
    await haveApp.waitFor({ state: 'visible', timeout: 15_000 });
    await haveApp.click({ timeout: 5_000 });

    await page.locator(sel.pin.input).waitFor({ state: 'visible', timeout: 30_000 });
    await answerPinPrompt(page, TEST_PIN);

    await expect(page.locator(sel.sync.qr)).toBeVisible({ timeout: 60_000 });
    const code = page.locator(sel.sync.identificationCode);
    await code.waitFor({ state: 'visible', timeout: 10_000 });
    expect((await code.inputValue()).length).toBeGreaterThan(0);
    await page.keyboard.press('Escape');
  });

  test('MCP: token reveal and the transaction tier are PIN-gated', async ({ appPage: page }) => {
    await openSettingsTab(page, 'mcp');

    // 10-mcp-server revoked the token, so MCP is disabled — enable it
    // fresh; a new token gets generated.
    const toggle = page.locator(sel.mcp.serverToggle);
    await toggle.waitFor({ state: 'visible', timeout: 15_000 });
    if (!(await toggle.isChecked())) {
      await toggle.locator('..').click({ timeout: 5_000 });
      await expect(toggle).toBeChecked({ timeout: 15_000 });
    }

    // Reveal now runs through the PIN prompt.
    await page.locator(sel.mcp.tokenReveal).click({ timeout: 10_000 });
    await page.locator(sel.pin.input).waitFor({ state: 'visible', timeout: 15_000 });
    await answerPinPrompt(page, TEST_PIN);
    const tokenValue = page.locator(sel.mcp.tokenValue);
    await expect(tokenValue).toHaveText(/^tu_[A-Za-z0-9_-]{16,}$/, { timeout: 15_000 });
    mcpToken = ((await tokenValue.textContent()) ?? '').trim();

    // Enabling the transaction tier requires the PIN too.
    const txTier = page.locator(sel.mcp.tierTransactions);
    await txTier.waitFor({ state: 'visible', timeout: 15_000 });
    await expect(txTier).not.toBeChecked(); // off by default
    await txTier.locator('..').click({ timeout: 5_000 });
    await page.locator(sel.pin.input).waitFor({ state: 'visible', timeout: 15_000 });
    await answerPinPrompt(page, TEST_PIN);
    await expect(txTier).toBeChecked({ timeout: 15_000 });
  });

  test('MCP send_transaction: in-app approval — deny, then approve', async ({ appPage: page }) => {
    test.setTimeout(600_000);
    expect(mcpToken, 'token captured by the reveal test').toMatch(/^tu_/);

    const client = new McpClient('http://127.0.0.1:19222', mcpToken);
    await client.initialize();

    // --- Deny: the tool call returns an error, no PIN is ever asked ---
    const denyCall = client.callTool('send_transaction', { destination: TEST_WALLET.address, amount: '1' }, 150_000);
    const denyCountdown = page.locator(sel.mcp.txCountdown);
    await denyCountdown.waitFor({ state: 'visible', timeout: 30_000 });
    await page.locator('[data-testid="modal-back"]').click({ timeout: 10_000 });
    const denied = await denyCall;
    expect(denied.isError).toBe(true);
    expect(denied.text).toMatch(/denied/i);

    // --- Approve: confirm → PIN → the transaction goes through ---
    const approveCall = client.callTool('send_transaction', { destination: TEST_WALLET.address, amount: '1' }, 150_000);
    await denyCountdown.waitFor({ state: 'visible', timeout: 30_000 });
    await page.locator(sel.send.confirmButton).click({ timeout: 10_000 });

    // Signing triggers the PIN dialog.
    await page.locator(sel.pin.input).waitFor({ state: 'visible', timeout: 30_000 });
    await answerPinPrompt(page, TEST_PIN);

    const approved = await approveCall;
    expect(approved.isError).toBe(false);
    expect(approved.text).toMatch(/success/i);
  });
});
