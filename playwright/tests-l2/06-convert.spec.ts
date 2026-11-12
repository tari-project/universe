import type { Page } from '@playwright/test';
import { test, expect } from '../helpers/l2/fixtures';
import { answerPinPrompt, TEST_PIN } from '../helpers/pin';
import { sel } from '../helpers/selectors';
import { openL2, l2Split, CONVERT_MICRO } from '../helpers/l2/ui';

/** Highest fee the backend will pay for one L2 transaction (MAX_L2_FEE). */
const MAX_FEE_MICRO = 100_000;

async function convert(page: Page, direction: 'shield' | 'unshield', micro: number): Promise<void> {
    await openL2(page);
    await page.locator(direction === 'shield' ? sel.l2.shield : sel.l2.unshield).click();
    await page.locator('input[name="amount"]').fill(String(micro / 1_000_000));
    await page.locator(sel.l2.convertReview).click();
    await page.locator(sel.l2.convertConfirm).click();
    // The prompt waits on the indexer's fee dry run, which can outlast answerPinPrompt's 10s.
    await page.locator(`${sel.pin.input} input`).first().waitFor({ state: 'visible', timeout: 60_000 });
    await answerPinPrompt(page, TEST_PIN);
    const done = page.locator(sel.l2.convertDone);
    await expect(done).toBeEnabled({ timeout: 120_000 });
    await done.click();
}

/** Waits for the panel to show the split `check` accepts and returns it. */
async function settledSplit(
    page: Page,
    check: (split: { revealed: number; confidential: number }) => boolean
): Promise<{ revealed: number; confidential: number }> {
    let split = { revealed: 0, confidential: 0 };
    await expect
        .poll(
            async () => {
                // Startup replay may reopen the L1 sidebar while the transaction settles.
                await openL2(page);
                split = await l2Split(page);
                return check(split);
            },
            { timeout: 180_000 }
        )
        .toBe(true);
    return split;
}

test('test_unshield_then_shield_moves_exact_amount_between_balances', async ({ appPage: page }) => {
    await openL2(page);
    const start = await l2Split(page);
    // The claim and the received transfer left confidential funds; the fee comes out of them too.
    expect(start.confidential).toBeGreaterThanOrEqual(CONVERT_MICRO + MAX_FEE_MICRO);

    // Unshield: revealed gains exactly the amount, confidential loses the amount and the fee.
    await convert(page, 'unshield', CONVERT_MICRO);
    const unshielded = await settledSplit(
        page,
        (s) => s.revealed === start.revealed + CONVERT_MICRO && s.confidential < start.confidential - CONVERT_MICRO
    );
    const unshieldFee = start.confidential - CONVERT_MICRO - unshielded.confidential;
    expect(unshieldFee).toBeGreaterThan(0);
    expect(unshieldFee).toBeLessThanOrEqual(MAX_FEE_MICRO);

    // Shield half of it back: confidential gains exactly that, revealed loses it and the fee.
    const back = CONVERT_MICRO / 2;
    await convert(page, 'shield', back);
    const shielded = await settledSplit(
        page,
        (s) => s.confidential === unshielded.confidential + back && s.revealed < unshielded.revealed - back
    );
    const shieldFee = unshielded.revealed - back - shielded.revealed;
    expect(shieldFee).toBeGreaterThan(0);
    expect(shieldFee).toBeLessThanOrEqual(MAX_FEE_MICRO);
});
