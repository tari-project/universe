import { test, expect } from '../helpers/l2/fixtures';
import { answerPinPrompt, TEST_PIN } from '../helpers/pin';
import { sel } from '../helpers/selectors';
import { openL2, l2Balance, BURN_MICRO } from '../helpers/l2/ui';
import { checkpointsCaughtUp, indexerEpoch, mine, until } from '../helpers/l2/swarm';

test('test_claim_ui_credits_burn_less_fee_and_lists_activity', async ({ appPage: page }) => {
    // Claimable poll, PIN prompt and settlement can each take minutes on a busy runner.
    test.setTimeout(720_000);
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
    // The button only needs the burn proof. The L2 takes the claim once its epoch is past the
    // burn's, which is at most one past the indexer's: it trails the L1 by fewer blocks than
    // an epoch holds. Then the claim's price read needs the checkpoints to catch up to it.
    const target = (await indexerEpoch()) + 2;
    await until('L2 epoch past the burn', async () => {
        if ((await indexerEpoch()) >= target) return true;
        await mine(5);
    });
    await checkpointsCaughtUp();
    await page.locator(sel.l2.claim).click();
    await answerPinPrompt(page, TEST_PIN);
    await expect.poll(() => l2Balance(page), { timeout: 180_000 }).toBeGreaterThan(before);
    const credited = (await l2Balance(page)) - before;
    expect(credited).toBeGreaterThan(0);
    expect(credited).toBeLessThanOrEqual(BURN_MICRO);
    await expect.poll(() => page.locator(sel.l2.historyRow).count(), { timeout: 120_000 }).toBeGreaterThan(rowsBefore);
    await expect(page.locator(sel.l2.historyRow).first()).toContainText('+');
});
