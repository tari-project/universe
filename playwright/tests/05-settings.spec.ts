import { test, expect } from '../helpers/fixtures';
import { sel } from '../helpers/selectors';
import { toggleAndRestore, setToggleState } from '../helpers/settings';

/** Click a radio (via its wrapper) until it registers as checked. */
async function selectRadio(page: Page, radio: ReturnType<Page['locator']>, timeout = 10_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await radio.isChecked().catch(() => false)) return;
    await radio
      .locator('..')
      .click({ timeout: 5_000, force: true })
      .catch(() => {});
    const ok = await radio
      .waitFor({ state: 'attached', timeout: 500 })
      .then(async () => radio.isChecked().catch(() => false))
      .catch(() => false);
    if (ok) return;
    await page.waitForTimeout(400);
  }
  throw new Error('radio did not become checked within timeout');
}
import type { Page } from '@playwright/test';

/** Ensure settings panel is open on the General tab. */
async function ensureSettingsOpen(page: Page) {
  // Dismiss any overlay/dialog that may be blocking (.overlay can resolve
  // to more than one node, so scope to the first).
  const overlay = page.locator('.overlay').first();
  if (await overlay.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape');
    await overlay.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
  }

  const generalTab = page.locator('[data-testid="settings-tab-general"]');
  if (!(await generalTab.isVisible().catch(() => false))) {
    await page.locator(sel.settings.open).click({ timeout: 5_000 });
    await generalTab.waitFor({ state: 'visible', timeout: 10_000 });
  }
}

/**
 * Flip a settings ToggleSwitch and restore it, converging on each state
 * (a single click can be lost / the store update can lag under load).
 */
async function toggleAndVerify(page: Page, testId: string) {
  await ensureSettingsOpen(page);
  await toggleAndRestore(page, `[data-testid="${testId}"]`);
}

test.describe('Settings', () => {
  test('opens on General tab by default with all expected sections', async ({ appPage: page }) => {
    await page.locator(sel.settings.open).click({ timeout: 5_000 });
    await expect(page.locator('[data-testid="settings-tab-general"]')).toBeVisible({ timeout: 10_000 });

    const expectedSections = [
      /auto.?start/i,
      /update.*automatically/i,
      /pre.?release/i,
      /language/i,
      /theme/i,
      /visual.*mode/i,
      /reset.*settings/i,
    ];

    for (const section of expectedSections) {
      await expect(page.getByText(section).first()).toBeVisible({ timeout: 5_000 });
    }
  });

  test('toggle: auto-start on system boot', async ({ appPage: page }) => {
    await ensureSettingsOpen(page);
    const input = page.locator('[data-testid="settings-toggle-autostart"]');
    await expect(input).not.toBeChecked();
    await toggleAndVerify(page, 'settings-toggle-autostart');
  });

  test('toggle: auto-update', async ({ appPage: page }) => {
    await toggleAndVerify(page, 'settings-toggle-autoupdate');
  });

  test('toggle: pre-release shows confirmation dialog', async ({ appPage: page }) => {
    await ensureSettingsOpen(page);
    const input = page.locator('[data-testid="settings-toggle-prerelease"]');
    await expect(input).not.toBeChecked();

    // Clicking the wrapper opens a "Confirm action" dialog (it does NOT flip
    // the toggle directly). The click can be lost under load, so retry until
    // the dialog appears.
    const wrapper = input.locator('..');
    const confirmDialog = page.getByText(/Confirm action/i).first();
    const deadline = Date.now() + 20_000;
    while (Date.now() < deadline) {
      if (await confirmDialog.isVisible().catch(() => false)) break;
      await wrapper.click({ timeout: 5_000, force: true }).catch(() => {});
      if (
        await confirmDialog.waitFor({ state: 'visible', timeout: 3_000 }).then(
          () => true,
          () => false
        )
      )
        break;
    }
    await expect(confirmDialog).toBeVisible({ timeout: 5_000 });

    // Cancel instead of confirming — avoids messy state cleanup.
    await page.keyboard.press('Escape');
    await confirmDialog.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});

    // Pre-release should still be off since we cancelled.
    await expect(input).not.toBeChecked();
  });

  test('toggle: notifications', async ({ appPage: page }) => {
    await toggleAndVerify(page, 'settings-toggle-notifications');
  });

  test('toggle: earn gems / telemetry', async ({ appPage: page }) => {
    await toggleAndVerify(page, 'settings-toggle-telemetry');
  });

  test('language: system language toggle and language selector', async ({ appPage: page }) => {
    await ensureSettingsOpen(page);
    const input = page.locator('[data-testid="settings-toggle-system-language"]');
    const sysLangEnabled = await input.isChecked();

    // Turn "use system language" off (converging) so the manual selector shows.
    if (sysLangEnabled) await setToggleState(page, '[data-testid="settings-toggle-system-language"]', false);

    // English should be visible as the current language
    await expect(page.getByText('English').first()).toBeVisible({ timeout: 5_000 });

    // Restore
    if (sysLangEnabled) await setToggleState(page, '[data-testid="settings-toggle-system-language"]', true);
  });

  test('theme: system, light, dark options', async ({ appPage: page }) => {
    await ensureSettingsOpen(page);
    const systemRadio = page.locator('input[name="theme_select"][value="system"]');
    const lightRadio = page.locator('input[name="theme_select"][value="light"]');
    const darkRadio = page.locator('input[name="theme_select"][value="dark"]');

    await expect(systemRadio).toBeAttached();
    await expect(lightRadio).toBeAttached();
    await expect(darkRadio).toBeAttached();

    await selectRadio(page, lightRadio);
    await expect(lightRadio).toBeChecked();

    await selectRadio(page, darkRadio);
    await expect(darkRadio).toBeChecked();

    await selectRadio(page, systemRadio);
    await expect(systemRadio).toBeChecked();
  });

  test('toggle: visual mode', async ({ appPage: page }) => {
    await ensureSettingsOpen(page);
    const input = page.locator('[data-testid="settings-toggle-visual-mode"]');
    await input.waitFor({ state: 'attached', timeout: 10_000 });

    // Visual Mode renders a WebGL scene, so the app DISABLES the toggle when
    // WebGL is unavailable (headless runners under load routinely fail to
    // create a GL context). A disabled toggle can never flip — treat "no
    // WebGL" as N/A (same as GPU features on unsupported hardware) and
    // assert the not-supported state instead of forcing the toggle.
    if (await input.isDisabled().catch(() => true)) {
      await expect(page.getByText(/webgl.*not.*support/i).first()).toBeVisible({ timeout: 10_000 });
      return;
    }
    await toggleAndVerify(page, 'settings-toggle-visual-mode');
  });

  test('report an issue: buttons visible', async ({ appPage: page }) => {
    await ensureSettingsOpen(page);
    await expect(page.locator('[data-testid="settings-open-logs"]')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('[data-testid="settings-submit-logs"]')).toBeVisible({ timeout: 5_000 });
  });

  test('application information: visible and copyable', async ({ appPage: page }) => {
    await ensureSettingsOpen(page);
    const appInfo = page.locator('[data-testid="settings-app-info"]');
    await expect(appInfo).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/Anon ID/i).first()).toBeVisible({ timeout: 5_000 });

    // Click Copy and converge on the clipboard actually holding something
    // (a lost click would leave it empty).
    const copyBtn = page.locator('[data-testid="settings-app-info-copy"]');
    await expect
      .poll(
        async () => {
          await copyBtn.click({ timeout: 5_000, force: true }).catch(() => {});
          return page.evaluate(
            () => (window as unknown as { __PLAYWRIGHT_CLIPBOARD__?: string }).__PLAYWRIGHT_CLIPBOARD__ ?? ''
          );
        },
        { timeout: 15_000, intervals: [500, 1000, 1000] }
      )
      .not.toBe('');
  });

  test('reset settings: opens confirmation dialog with cancel', async ({ appPage: page }) => {
    await ensureSettingsOpen(page);
    const resetBtn = page.locator('[data-testid="settings-reset-button"]');
    await expect(resetBtn).toBeVisible({ timeout: 5_000 });

    // Converge on the dialog opening (a lost click would hang the waitFor).
    const dialog = page.locator('[data-testid="settings-reset-dialog"]');
    const deadline = Date.now() + 20_000;
    while (Date.now() < deadline) {
      if (await dialog.isVisible().catch(() => false)) break;
      await resetBtn.click({ timeout: 5_000, force: true }).catch(() => {});
      if (
        await dialog.waitFor({ state: 'visible', timeout: 3_000 }).then(
          () => true,
          () => false
        )
      )
        break;
    }
    await dialog.waitFor({ state: 'visible', timeout: 5_000 });

    const cancelBtn = page.locator('[data-testid="settings-reset-cancel"]');
    await expect(cancelBtn).toBeVisible({ timeout: 3_000 });

    // Do NOT confirm — cancel
    await cancelBtn.click({ timeout: 5_000 });
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });
  });
});
