import { test, expect } from '../helpers/l2/fixtures';
import { sel } from '../helpers/selectors';
import { openL2, l2Balance, l2Address, RECEIVE_MICRO } from '../helpers/l2/ui';
import { Walletd } from '../helpers/l2/walletd';

test('test_receive_walletd_transfer_credits_exact_amount_and_activity', async ({ appPage: page }) => {
    await openL2(page);
    const before = await l2Balance(page);
    const rowsBefore = await page.locator(sel.l2.historyRow).count();
    await new Walletd().transfer(await l2Address(page), RECEIVE_MICRO);
    await expect.poll(() => l2Balance(page), { timeout: 180_000 }).toBe(before + RECEIVE_MICRO);
    await expect.poll(() => page.locator(sel.l2.historyRow).count(), { timeout: 120_000 }).toBeGreaterThan(rowsBefore);
    await expect(page.locator(sel.l2.historyRow).filter({ hasText: 'Received' }).first()).toContainText('+');
});
