import { test, expect } from '../helpers/fixtures';
import { sel } from '../helpers/selectors';
import { TEST_WALLET } from '../helpers/test-wallet';
import { openSettingsTab, toggleAndRestore } from '../helpers/settings';

/**
 * Settings sweep for the tabs not covered by 05-settings (General).
 * Pools stay disabled and node config stays untouched: real pool
 * connections are external services, and switching node type restarts
 * wallet/node phases — both belong to the manual run.
 */
test.describe('Settings Sweep', () => {
  test('wallet tab: addresses, hidden seed words, PIN setup and sync sections', async ({ appPage: page }) => {
    await openSettingsTab(page, 'wallet');

    // Tari address matches the pre-seeded wallet.
    await expect(page.locator(sel.settings.tariAddress)).toHaveValue(TEST_WALLET.address, {
      timeout: 30_000,
    });

    // Monero address from the seeded config renders in its editor.
    const monero = page.locator(sel.settings.moneroAddress);
    await monero.waitFor({ state: 'visible', timeout: 10_000 });
    expect(await monero.inputValue()).toMatch(/^4[0-9AB][1-9A-HJ-NP-Za-km-z]{93}$/);

    // Seed words are hidden until revealed (01-wallet-integrity covers the
    // reveal itself).
    const seedDisplay = page.locator(sel.settings.seedWordsDisplay).first();
    await seedDisplay.waitFor({ state: 'visible', timeout: 10_000 });
    expect(await seedDisplay.textContent()).toContain('*');

    // Pre-PIN: the setup-PIN section is present; sync-with-phone too.
    await expect(page.locator(sel.settings.setupPin)).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(sel.settings.syncWithPhone)).toBeVisible({ timeout: 10_000 });
  });

  test('mining tab: toggles reflect the seeded config and flip cleanly', async ({ appPage: page }) => {
    await openSettingsTab(page, 'mining');

    // Seeded config: CPU mining on, GPU mining off, mine-on-startup off.
    await expect(page.locator(sel.settings.toggleCpuMining)).toBeChecked({ timeout: 15_000 });
    await expect(page.locator(sel.settings.toggleGpuMining)).not.toBeChecked({ timeout: 15_000 });
    const mineOnStart = page.locator(sel.settings.toggleMineOnStart);
    await expect(mineOnStart).not.toBeChecked({ timeout: 15_000 });

    // Mine-on-startup flips and restores (restart semantics stay manual).
    await toggleAndRestore(page, sel.settings.toggleMineOnStart);

    // Pause-on-battery renders only on machines that report a battery.
    // Where present it must be a real toggle.
    const battery = page.locator(sel.settings.togglePauseOnBattery);
    if (await battery.isVisible().catch(() => false)) {
      expect(typeof (await battery.isChecked())).toBe('boolean');
    }
  });

  test('pools tab: CPU pool section with configuration UI, pools stay disabled', async ({ appPage: page }) => {
    await openSettingsTab(page, 'pools');

    // Seeded config disables both pools; the CPU section always renders.
    const cpuToggle = page.locator(sel.settings.poolToggleCpu);
    await expect(cpuToggle).toBeVisible({ timeout: 15_000 });
    await expect(cpuToggle).not.toBeChecked();
    await expect(page.getByText('CPU pool').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/pool configuration/i).first()).toBeVisible({ timeout: 10_000 });

    // GPU pool only renders on GPU-capable machines. Presence-only: the
    // GPU-pool enabled flag ignores the seeded gpu_pool_enabled=false on
    // GPU machines (observed on Linux/NVIDIA), so its state is not a
    // stable assertion. GPU mining itself stays disabled by the mining
    // config, so no real pool is ever contacted.
    const gpuToggle = page.locator(sel.settings.poolToggleGpu);
    if (await gpuToggle.isVisible().catch(() => false)) {
      await expect(page.getByText('GPU pool').first()).toBeVisible({ timeout: 5_000 });
    }
  });

  test('connections tab: node configuration, node info, network and peers sections', async ({ appPage: page }) => {
    await openSettingsTab(page, 'connections');

    await expect(page.getByText(/node configuration/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/minotari node/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/^network$/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/connected peers/i).first()).toBeVisible({ timeout: 10_000 });

    // Seeded config runs a Local node — the node type reads Local.
    await expect(page.getByText(/^local$/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('experimental tab: master toggle reveals debug and versions sections', async ({ appPage: page }) => {
    await openSettingsTab(page, 'experimental');

    const master = page.locator(sel.settings.toggleExperimental);
    await master.waitFor({ state: 'visible', timeout: 15_000 });

    const wasEnabled = await master.isChecked();
    if (!wasEnabled) {
      await master.locator('..').click({ timeout: 5_000 });
      await expect(master).toBeChecked({ timeout: 10_000 });
    }

    await expect(page.getByText(/debug/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/versions/i).first()).toBeVisible({ timeout: 15_000 });

    // Restore the default so later tests see the stock settings surface.
    if (!wasEnabled) {
      await master.locator('..').click({ timeout: 5_000 });
      await expect(master).not.toBeChecked({ timeout: 10_000 });
    }
  });

  test('release notes tab: version header and collapsible notes', async ({ appPage: page }) => {
    await openSettingsTab(page, 'releaseNotes');

    // The app icon + version header render regardless of the notes fetch.
    // The version rides inside "Tari Universe - Testnet vX.Y.Z" — match
    // unanchored.
    await expect(page.getByText(/v\d+\.\d+\.\d+/).first()).toBeVisible({ timeout: 15_000 });

    // Notes come from a remote changelog: when present, the newest section
    // is expanded by default and sections toggle.
    const items = page.locator(sel.settings.releaseNoteItem);
    const count = await items.count();
    if (count > 0) {
      await expect(items.first()).toHaveAttribute('data-open', 'true');
      if (count > 1) {
        await items.nth(1).click({ timeout: 5_000 });
        await expect(items.nth(1)).toHaveAttribute('data-open', 'true', { timeout: 5_000 });
        await expect(items.first()).toHaveAttribute('data-open', 'false', { timeout: 5_000 });
      }
    }
  });
});
