import { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { sel } from './selectors';

/**
 * Open the Settings dialog (if needed) and switch to the given tab.
 * Tab names are the `SETTINGS_TYPES` strings: general, airdrop, wallet,
 * mining, pools, connections, mcp, experimental, releaseNotes.
 */
export async function openSettingsTab(page: Page, tab: string) {
  // Dismiss any overlay/dialog that may be blocking the settings button.
  // (.overlay can resolve to more than one node, so scope to the first.)
  const overlay = page.locator('.overlay').first();
  if (await overlay.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape');
    await overlay.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
  }

  const tabButton = page.locator(sel.settings.tab(tab));
  if (!(await tabButton.isVisible().catch(() => false))) {
    await page.locator(sel.settings.open).click({ timeout: 10_000 });
    await tabButton.waitFor({ state: 'visible', timeout: 10_000 });
  }
  await tabButton.click({ timeout: 5_000 });
  // Section content mounts after the tab switch — settle briefly.
  await page.waitForTimeout(500);
}

/**
 * Drive a ToggleSwitch to a desired checked state and converge on it. A
 * single wrapper click can be lost (framer-motion remount, or the store
 * update lagging behind under load), leaving the state unflipped — so poll
 * the real `checked` value and re-click until it matches, or time out.
 */
export async function setToggleState(page: Page, selector: string, desired: boolean, timeout = 15_000) {
  const input = page.locator(selector);
  const wrapper = input.locator('..');
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if ((await input.isChecked().catch(() => !desired)) === desired) return;
    await wrapper.click({ timeout: 5_000, force: true }).catch(() => {});
    await page.waitForTimeout(750);
  }
  throw new Error(`Toggle ${selector} did not reach checked=${desired} within ${timeout}ms`);
}

/**
 * Flip a ToggleSwitch to the opposite of its current state and back, each
 * step converging on the target (never a single unchecked click). Verifies
 * the flip happened and the original state is restored.
 */
export async function toggleAndRestore(page: Page, selector: string) {
  const input = page.locator(selector);
  const initial = await input.isChecked();
  await setToggleState(page, selector, !initial);
  await expect(input).toBeChecked({ checked: !initial });
  await setToggleState(page, selector, initial);
  await expect(input).toBeChecked({ checked: initial });
}
