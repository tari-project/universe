import { test, expect } from '../helpers/l2/fixtures';
import { answerPinPrompt, TEST_PIN } from '../helpers/pin';
import { sel } from '../helpers/selectors';
import { getWalletBalance, waitForWalletReady, openMiningSidebar } from '../helpers/wait-for';
import { openL2, BURN_XTM } from '../helpers/l2/ui';
import { mine } from '../helpers/l2/swarm';

test('test_burn_ui_records_l1_history_and_debits_balance', async ({ appPage: page }) => {
    await openMiningSidebar(page);
    await waitForWalletReady(page);
    const before = await getWalletBalance(page);
    expect(before).toBeGreaterThan(BURN_XTM);
    await openL2(page);
    await page.locator(sel.l2.burn).click();
    await page.locator('input[name="amount"]').fill(String(BURN_XTM));
    await page.locator('input[name="message"]').fill('pw-l2-burn');
    await page.locator(sel.l2.burnReview).click();
    await page.locator(sel.l2.burnConfirm).click();
    await answerPinPrompt(page, TEST_PIN);
    await expect(page.locator(sel.l2.burnDone)).toBeVisible({ timeout: 120_000 });
    await page.locator(sel.l2.burnDone).click();
    await mine(10);
    await expect(page.locator(sel.l2.claimRow)).toHaveCount(1);
    await openMiningSidebar(page);
    await expect(page.locator(sel.wallet.balance)).toBeVisible();
    await expect.poll(() => getWalletBalance(page), { timeout: 120_000 }).toBeLessThanOrEqual(before - BURN_XTM);
    await expect(page.locator('[data-testid="tx-row-sent"]').filter({ hasText: 'pw-l2-burn' }).first()).toBeVisible({
        timeout: 120_000,
    });
});
