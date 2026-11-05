import { test, expect } from '../helpers/l2/fixtures';
import { answerPinPrompt, TEST_PIN } from '../helpers/pin';
import { sel } from '../helpers/selectors';
import { openL2, l2Balance, BURN_MICRO } from '../helpers/l2/ui';
import { mine } from '../helpers/l2/swarm';

test('test_claim_ui_credits_burn_less_fee_and_lists_activity', async ({ appPage: page }) => {
    await openL2(page);
    const before = await l2Balance(page);
    const rowsBefore = await page.locator(sel.l2.historyRow).count();
    await expect
        .poll(
            async () => {
                if (
                    await page
                        .locator(sel.l2.claim)
                        .isEnabled()
                        .catch(() => false)
                )
                    return true;
                await mine(5);
                return false;
            },
            { timeout: 180_000, intervals: [2000] }
        )
        .toBe(true);
    await page.locator(sel.l2.claim).click();
    await answerPinPrompt(page, TEST_PIN);
    await expect.poll(() => l2Balance(page), { timeout: 180_000 }).toBeGreaterThan(before);
    const credited = (await l2Balance(page)) - before;
    expect(credited).toBeGreaterThan(0);
    expect(credited).toBeLessThanOrEqual(BURN_MICRO);
    await expect.poll(() => page.locator(sel.l2.historyRow).count(), { timeout: 120_000 }).toBeGreaterThan(rowsBefore);
    await expect(page.locator(sel.l2.historyRow).first()).toContainText('+');
});
