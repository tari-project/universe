import { test, expect } from '../helpers/fixtures';
import { sel } from '../helpers/selectors';
import { TEST_WALLET, TEST_MONERO, OTHER_MONERO_SEED_WORDS } from '../helpers/test-wallet';
import { openSettingsTab } from '../helpers/settings';
import { answerPinPrompt, answerPinCreation, TEST_PIN, NEW_PIN } from '../helpers/pin';
import type { Page } from '@playwright/test';

/**
 * PIN re-creation and forgot-PIN recovery — the guards added in #3361 on
 * the paths where the app itself can destroy the only copy of a seed.
 *
 * Runs AFTER `95-security-pin` (which sets the PIN to TEST_PIN, the state
 * every test here needs) and BEFORE `98-wallet-import` (which replaces the
 * active wallet). Serial: each test leaves the PIN the next one expects,
 * and the last test puts it back to TEST_PIN so 98 and 99 still work.
 *
 * The fixture profile owns a GENERATED Monero wallet (TEST_MONERO,
 * pre-seeded by global-setup), which is what makes the Monero half of
 * `forgot_pin` reachable at all.
 */

/** Settings → Wallet renders Tari seed words first, Monero second. */
const TARI_SEED = 0;
const MONERO_SEED = 1;

/** Reader for the nth seed-words display, shaped for `expect.poll`. */
function seedWordsOf(page: Page, index: number) {
  return async () => {
    const text =
      (await page
        .locator(sel.settings.seedWordsDisplay)
        .nth(index)
        .textContent()
        .catch(() => '')) ?? '';
    return text
      .split(/\d+\./)
      .map((w) => w.trim())
      .filter((w) => w.length > 0);
  };
}

/** Click an eye icon, answer the PIN gate it raises. */
async function revealSeedWords(page: Page, index: number, pin: string) {
  await page.locator(sel.settings.seedToggle).nth(index).click({ timeout: 10_000 });
  await page.locator(sel.pin.input).waitFor({ state: 'visible', timeout: 15_000 });
  await answerPinPrompt(page, pin);
}

/**
 * Raise a PIN prompt (the seed-words reveal is the cheapest one) and take
 * its "Forgot PIN" escape hatch. The security store swaps one modal for the
 * other, so wait for the PIN input to go before touching the recovery form.
 */
async function openForgotPinDialog(page: Page) {
  await openSettingsTab(page, 'wallet');
  await page.locator(sel.settings.seedToggle).first().click({ timeout: 10_000 });
  await page.locator(sel.pin.input).waitFor({ state: 'visible', timeout: 15_000 });
  await page.getByRole('button', { name: 'Forgot PIN', exact: true }).click({ timeout: 10_000 });
  await page.locator(sel.pin.input).waitFor({ state: 'hidden', timeout: 15_000 });
  await page.locator(sel.settings.seedInput).waitFor({ state: 'visible', timeout: 15_000 });
}

/** The recovery form's only submit button; its label is part of the guard. */
const forgotSubmit = (page: Page) =>
  page.getByRole('button', { name: /^(Forgot PIN|Continue and create a new Monero wallet)$/ });

const moneroWordsInput = (page: Page) => page.getByPlaceholder(/Monero seed words/i);

async function fillRecoveryForm(page: Page, moneroWords: string[]) {
  await page.locator(sel.settings.seedInput).fill(TEST_WALLET.seedWords.join(' '));
  if (moneroWords.length) {
    await moneroWordsInput(page).fill(moneroWords.join(' '));
  }
}

test.describe.serial('PIN recovery', () => {
  test('create_pin is refused once a PIN is set', async ({ appPage: page }) => {
    await openSettingsTab(page, 'wallet');

    // Settings → Wallet drops the setup-PIN section as soon as a PIN
    // exists (95 asserts that), so the guard has no UI route: invoke the
    // command through the remote-ui shim, the way 99-shutdown does.
    await expect(page.locator(sel.settings.setupPin)).toHaveCount(0);

    const result = await page.evaluate(async () => {
      const fn = (window as unknown as { __PLAYWRIGHT_INVOKE__?: (c: string) => Promise<unknown> })
        .__PLAYWRIGHT_INVOKE__;
      try {
        await fn?.('create_pin');
        return 'resolved';
      } catch (e) {
        return String(e);
      }
    });

    // Without the guard this opens a second PIN-creation dialog and
    // re-encrypts the already enciphered Monero seed.
    expect(result).toContain('A PIN is already set for this wallet');
  });

  test('forgot PIN with Monero words for another wallet changes nothing', async ({ appPage: page }) => {
    await openForgotPinDialog(page);
    await fillRecoveryForm(page, OTHER_MONERO_SEED_WORDS);
    await forgotSubmit(page).click({ timeout: 10_000 });

    // Rejected before any credential is touched — no PIN-creation dialog.
    await expect(page.getByText(/Monero seed words do not match/i).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Create your Wallet PIN').first()).toBeHidden();

    // Nothing moved: TEST_PIN still opens both seeds, and the Monero one is
    // still this wallet's. (Both reveals go to the backend; the settings
    // Monero address field is a store value that recovery does not re-emit,
    // so it would read unchanged either way.)
    await page.keyboard.press('Escape');
    await openSettingsTab(page, 'wallet');

    await revealSeedWords(page, TARI_SEED, TEST_PIN);
    await expect.poll(seedWordsOf(page, TARI_SEED), { timeout: 60_000 }).toEqual(TEST_WALLET.seedWords);

    await revealSeedWords(page, MONERO_SEED, TEST_PIN);
    await expect.poll(seedWordsOf(page, MONERO_SEED), { timeout: 60_000 }).toEqual(TEST_MONERO.seedWords);
  });

  test('forgot PIN with the right Monero words keeps the Monero wallet', async ({ appPage: page }) => {
    await openForgotPinDialog(page);
    await fillRecoveryForm(page, TEST_MONERO.seedWords);
    await expect(forgotSubmit(page)).toHaveText('Forgot PIN');
    await forgotSubmit(page).click({ timeout: 10_000 });

    await answerPinCreation(page, NEW_PIN);

    await openSettingsTab(page, 'wallet');
    // Both seeds survived the recovery, re-enciphered under the new PIN —
    // the same Monero wallet, not a replacement.
    await revealSeedWords(page, TARI_SEED, NEW_PIN);
    await expect.poll(seedWordsOf(page, TARI_SEED), { timeout: 60_000 }).toEqual(TEST_WALLET.seedWords);

    await revealSeedWords(page, MONERO_SEED, NEW_PIN);
    await expect.poll(seedWordsOf(page, MONERO_SEED), { timeout: 60_000 }).toEqual(TEST_MONERO.seedWords);
  });

  test('forgot PIN without Monero words replaces the Monero wallet, as the button says', async ({ appPage: page }) => {
    await openForgotPinDialog(page);
    await fillRecoveryForm(page, []);

    // The only warning the user gets that this Monero wallet is about to
    // be thrown away.
    await expect(forgotSubmit(page)).toHaveText('Continue and create a new Monero wallet');
    await forgotSubmit(page).click({ timeout: 10_000 });

    // Back to TEST_PIN so 98-wallet-import and 99-shutdown still work.
    await answerPinCreation(page, TEST_PIN);

    await openSettingsTab(page, 'wallet');
    // The Tari wallet is untouched by the Monero replacement.
    await revealSeedWords(page, TARI_SEED, TEST_PIN);
    await expect.poll(seedWordsOf(page, TARI_SEED), { timeout: 60_000 }).toEqual(TEST_WALLET.seedWords);

    // A different Monero wallet now, enciphered under the new PIN. Read the
    // seed rather than the settings address field: recovery updates the
    // Monero address in the backend config without re-emitting the wallet
    // config, so a page opened before the recovery still shows the old one.
    await revealSeedWords(page, MONERO_SEED, TEST_PIN);
    await expect.poll(seedWordsOf(page, MONERO_SEED), { timeout: 60_000 }).toHaveLength(25);
    expect(await seedWordsOf(page, MONERO_SEED)()).not.toEqual(TEST_MONERO.seedWords);
  });
});
