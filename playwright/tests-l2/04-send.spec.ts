import { test, expect } from '../helpers/l2/fixtures';
import { answerPinPrompt, TEST_PIN } from '../helpers/pin';
import { sel } from '../helpers/selectors';
import { openL2, l2Balance, SEND_MICRO } from '../helpers/l2/ui';
import { Walletd } from '../helpers/l2/walletd';

test('test_send_ui_credits_walletd_exact_amount', async ({ appPage: page }) => {
    const walletd = new Walletd();
    const recipient = await walletd.account();
    const recipientBefore = await walletd.balance();
    await openL2(page);
    const before = await l2Balance(page);
    await page.locator(sel.l2.send).click();
    await page.locator('input[name="l2Address"]').fill(recipient.address);
    await page.locator('input[name="amount"]').fill(String(SEND_MICRO / 1_000_000));
    await page.locator(sel.l2.sendReview).click();
    await page.locator(sel.l2.sendConfirm).click();
    await answerPinPrompt(page, TEST_PIN);
    await expect.poll(() => walletd.balance(), { timeout: 180_000 }).toBe(recipientBefore + SEND_MICRO);
    // Startup replay may reopen the L1 sidebar while the signed transfer settles.
    await openL2(page);
    await expect.poll(() => l2Balance(page), { timeout: 120_000 }).toBeLessThan(before);
});
