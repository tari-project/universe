import { test, expect, Page, BrowserContext } from '@playwright/test';
import { initReadinessMarker, waitForTauriReady } from '../helpers/state';
import { dismissDialogs } from '../helpers/wait-for';
import { sel } from '../helpers/selectors';

let context: BrowserContext;
let page: Page;

test.beforeAll(async ({ browser }) => {
  context = await browser.newContext();
  page = await context.newPage();
  await initReadinessMarker(page);
  await page.goto('http://localhost:1420/');
  await waitForTauriReady(page);
  await dismissDialogs(page);
});

test.afterAll(async () => {
  await context?.close();
});

/** Ensure settings panel is open on the General tab. */
async function ensureSettingsOpen() {
  // Dismiss any overlay/dialog that may be blocking
  const overlay = page.locator('.overlay');
  if (await overlay.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  const generalTab = page.locator('[data-testid="settings-tab-general"]');
  if (!(await generalTab.isVisible().catch(() => false))) {
    await page.locator(sel.settings.open).click({ timeout: 5_000 });
    await page.waitForTimeout(1_000);
  }
}

/**
 * Toggle a ToggleSwitch by clicking its parent wrapper (the visible
 * switch area), then verify the hidden input changed state. Restores
 * the original value afterwards.
 */
async function toggleAndVerify(testId: string) {
  await ensureSettingsOpen();
  const input = page.locator(`[data-testid="${testId}"]`);
  const wrapper = input.locator('..');
  const initial = await input.isChecked();

  await wrapper.click({ timeout: 5_000 });
  await page.waitForTimeout(500);
  if (initial) {
    await expect(input).not.toBeChecked();
  } else {
    await expect(input).toBeChecked();
  }

  // Restore
  await wrapper.click({ timeout: 5_000 });
  await page.waitForTimeout(500);
}

test.describe('Settings', () => {
  test('opens on General tab by default with all expected sections', async () => {
    await page.locator(sel.settings.open).click({ timeout: 5_000 });
    await page.waitForTimeout(1_000);

    await expect(page.locator('[data-testid="settings-tab-general"]')).toBeVisible({ timeout: 5_000 });

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

  test('toggle: auto-start on system boot', async () => {
    const input = page.locator('[data-testid="settings-toggle-autostart"]');
    await expect(input).not.toBeChecked();
    await toggleAndVerify('settings-toggle-autostart');
  });

  test('toggle: auto-update', async () => {
    await toggleAndVerify('settings-toggle-autoupdate');
  });

  test('toggle: pre-release shows confirmation dialog', async () => {
    await ensureSettingsOpen();
    const input = page.locator('[data-testid="settings-toggle-prerelease"]');
    await expect(input).not.toBeChecked();

    // Click wrapper to toggle — should show confirmation dialog
    const wrapper = input.locator('..');
    await wrapper.click({ timeout: 5_000 });
    await page.waitForTimeout(1_000);

    // Confirmation dialog should appear with "Confirm action" heading
    const confirmDialog = page.getByText(/Confirm action/i).first();
    await expect(confirmDialog).toBeVisible({ timeout: 5_000 });

    // Cancel instead of confirming — avoids messy state cleanup
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Pre-release should still be off since we cancelled
    await expect(input).not.toBeChecked();
  });

  test('toggle: notifications', async () => {
    await toggleAndVerify('settings-toggle-notifications');
  });

  test('toggle: earn gems / telemetry', async () => {
    await toggleAndVerify('settings-toggle-telemetry');
  });

  test('language: system language toggle and language selector', async () => {
    await ensureSettingsOpen();
    const input = page.locator('[data-testid="settings-toggle-system-language"]');
    const wrapper = input.locator('..');

    const sysLangEnabled = await input.isChecked();
    if (sysLangEnabled) {
      await wrapper.click({ timeout: 5_000 });
      await page.waitForTimeout(500);
    }

    // English should be visible as the current language
    await expect(page.getByText('English').first()).toBeVisible({ timeout: 5_000 });

    // Restore
    if (sysLangEnabled) {
      await wrapper.click({ timeout: 5_000 });
      await page.waitForTimeout(500);
    }
  });

  test('theme: system, light, dark options', async () => {
    await ensureSettingsOpen();
    const systemRadio = page.locator('input[name="theme_select"][value="system"]');
    const lightRadio = page.locator('input[name="theme_select"][value="light"]');
    const darkRadio = page.locator('input[name="theme_select"][value="dark"]');

    await expect(systemRadio).toBeAttached();
    await expect(lightRadio).toBeAttached();
    await expect(darkRadio).toBeAttached();

    // Click light
    await lightRadio.locator('..').click({ timeout: 5_000 });
    await page.waitForTimeout(500);
    await expect(lightRadio).toBeChecked();

    // Click dark
    await darkRadio.locator('..').click({ timeout: 5_000 });
    await page.waitForTimeout(500);
    await expect(darkRadio).toBeChecked();

    // Restore system
    await systemRadio.locator('..').click({ timeout: 5_000 });
    await page.waitForTimeout(500);
    await expect(systemRadio).toBeChecked();
  });

  test('toggle: visual mode', async () => {
    await toggleAndVerify('settings-toggle-visual-mode');
  });

  test('report an issue: buttons visible', async () => {
    await ensureSettingsOpen();
    await expect(page.locator('[data-testid="settings-open-logs"]')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('[data-testid="settings-submit-logs"]')).toBeVisible({ timeout: 5_000 });
  });

  test('application information: visible and copyable', async () => {
    await ensureSettingsOpen();
    const appInfo = page.locator('[data-testid="settings-app-info"]');
    await expect(appInfo).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/Anon ID/i).first()).toBeVisible({ timeout: 5_000 });

    const copyBtn = page.locator('[data-testid="settings-app-info-copy"]');
    await copyBtn.click({ timeout: 5_000 });

    const clipboard = await page.evaluate(() => (window as any).__PLAYWRIGHT_CLIPBOARD__ || '');
    expect(clipboard.length).toBeGreaterThan(0);
  });

  test('reset settings: opens confirmation dialog with cancel', async () => {
    await ensureSettingsOpen();
    const resetBtn = page.locator('[data-testid="settings-reset-button"]');
    await expect(resetBtn).toBeVisible({ timeout: 5_000 });
    await resetBtn.click({ timeout: 5_000 });

    const dialog = page.locator('[data-testid="settings-reset-dialog"]');
    await dialog.waitFor({ state: 'visible', timeout: 5_000 });

    const cancelBtn = page.locator('[data-testid="settings-reset-cancel"]');
    await expect(cancelBtn).toBeVisible({ timeout: 3_000 });

    // Do NOT confirm — cancel
    await cancelBtn.click({ timeout: 5_000 });
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });
  });
});
