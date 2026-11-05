import { test, expect } from '../helpers/l2/fixtures';
import { answerPinCreation, answerPinPrompt, TEST_PIN } from '../helpers/pin';
import { openSettingsTab } from '../helpers/settings';
import { sel } from '../helpers/selectors';
import { waitForMiningReady } from '../helpers/wait-for';
import { openL2, l2Address } from '../helpers/l2/ui';

test('test_setup_pin_and_l2_ui_unlocks_localnet_wallet', async ({ appPage: page }) => {
    // Navigation is rendered before the backend's wallet/L2 setup phase has finished.
    await waitForMiningReady(page, 180_000);
    await openSettingsTab(page, 'wallet');
    await page.locator(sel.settings.setupPin).click();
    await answerPinCreation(page, TEST_PIN);
    // Creation finishes encrypting the seed before the backend publishes PinLocked.
    await expect(page.locator(sel.settings.setupPin)).not.toBeVisible({ timeout: 60_000 });
    await page.keyboard.press('Escape');
    await page.locator(sel.l2.open).click();
    await answerPinPrompt(page, TEST_PIN);
    await openL2(page);
    await expect(page.locator(sel.l2.wallet)).toBeVisible();
    expect(await l2Address(page)).toMatch(/^otl_loc/);
});
