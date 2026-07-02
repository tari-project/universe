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
  const overlay = page.locator('.overlay');
  if (await overlay.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
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
 * Toggle a ToggleSwitch (checkbox input carrying the testid) by clicking
 * its wrapper, verify the checked state flipped, then restore it.
 */
export async function toggleAndRestore(page: Page, selector: string) {
  const input = page.locator(selector);
  const wrapper = input.locator('..');
  const initial = await input.isChecked();

  await wrapper.click({ timeout: 5_000 });
  await page.waitForTimeout(500);
  if (initial) {
    await expect(input).not.toBeChecked();
  } else {
    await expect(input).toBeChecked();
  }

  await wrapper.click({ timeout: 5_000 });
  await page.waitForTimeout(500);
  if (initial) {
    await expect(input).toBeChecked();
  } else {
    await expect(input).not.toBeChecked();
  }
}
