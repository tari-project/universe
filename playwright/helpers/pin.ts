import { Page } from '@playwright/test';
import { sel } from './selectors';

/** The PIN used by the security-pin spec. No leading zero — the create
 *  dialog serializes the PIN as a number over the event bridge. */
export const TEST_PIN = '135246';
export const WRONG_PIN = '999999';
/** The replacement PIN 96-pin-recovery sets during a forgot-PIN recovery. */
export const NEW_PIN = '246135';

/**
 * Type a 6-digit PIN into the currently visible PIN input. The inputs
 * auto-advance focus; filling each digit input directly is deterministic.
 * The backend raises the prompt only after its own work: an L2 claim makes up
 * to three indexer calls of up to 30s each (claimed check, epoch, fee dry run)
 * before asking, which on a busy runner took over a minute. It waits five
 * minutes for the answer, so the test can wait for the question.
 */
export async function enterPinDigits(page: Page, pin: string) {
  const inputs = page.locator(`${sel.pin.input} input`);
  await inputs.first().waitFor({ state: 'visible', timeout: 180_000 });
  for (let i = 0; i < pin.length; i++) {
    await inputs.nth(i).fill(pin[i]);
  }
}

/**
 * Answer the shared "Enter your PIN" dialog. EnterPin auto-submits when
 * the last digit lands, so no button click is needed — just wait for the
 * pin input to leave the DOM.
 */
export async function answerPinPrompt(page: Page, pin: string, timeout = 15_000) {
  await enterPinDigits(page, pin);
  await page
    .locator(sel.pin.input)
    .waitFor({ state: 'hidden', timeout })
    .catch(() => {});
}

/**
 * Answer the "Create your Wallet PIN" dialog a backend command raised
 * (`create_pin`, or `forgot_pin` via `recover_forgotten_pin`): the create
 * step, the confirm step, then the all-done step. Re-enciphering the seed
 * is argon2 work, so the completion step gets a long timeout.
 */
export async function answerPinCreation(page: Page, pin: string, timeout = 60_000) {
  await page.getByText('Create your Wallet PIN').first().waitFor({ state: 'visible', timeout });
  await enterPinDigits(page, pin);
  await page.locator(sel.pin.createSubmit).click({ timeout: 5_000 });

  await page.getByText('Confirm your PIN').first().waitFor({ state: 'visible', timeout: 15_000 });
  await enterPinDigits(page, pin);
  await page.locator(sel.pin.createSubmit).click({ timeout: 5_000 });

  await page.getByText('Continue to Tari Universe').first().click({ timeout });
}
