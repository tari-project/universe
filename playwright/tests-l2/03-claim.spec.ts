import { test, expect } from '../helpers/l2/fixtures';
import { sel } from '../helpers/selectors';
import { openL2, l2Balance, BURN_MICRO } from '../helpers/l2/ui';
import { mine } from '../helpers/l2/swarm';

test('test_claim_ui_credits_burn_less_fee_and_lists_activity', async ({ appPage: page }) => {
    await openL2(page);
    await expect
        .poll(
            async () => {
                if ((await l2Balance(page)) > 0) return true;
                await mine(5);
                return false;
            },
            { timeout: 180_000, intervals: [2000] }
        )
        .toBe(true);
    const credited = await l2Balance(page);
    expect(credited).toBeGreaterThan(0);
    expect(credited).toBeLessThanOrEqual(BURN_MICRO);
    await expect(page.locator(sel.l2.claimRow)).toHaveCount(0);
    await expect.poll(() => page.locator(sel.l2.historyRow).count(), { timeout: 120_000 }).toBeGreaterThan(0);
    await expect(page.locator(sel.l2.historyRow).first()).toContainText('+');
});
