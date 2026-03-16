import { test, expect, Page, BrowserContext } from '@playwright/test';
import { initReadinessMarker, waitForTauriReady } from '../helpers/state';
import {
  dismissDialogs,
  waitForMiningReady,
  clickStartMining,
  waitForMiningActive,
  clickStopMining,
  waitForMiningStopped,
  getWalletBalance,
  waitForWalletBalance,
} from '../helpers/wait-for';

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

test.describe('Mining Flow', () => {
  test('app launches and mining controls become ready', async () => {
    await waitForMiningReady(page, 120_000);
    const startBtn = page.locator('[data-testid="mining-button-start"]');
    const resumeBtn = page.locator('[data-testid="mining-button-resume"]');
    await expect(startBtn.or(resumeBtn)).toBeVisible();
  });

  test('start mining via UI, verify active state, then stop', async () => {
    await waitForMiningReady(page, 60_000);
    await clickStartMining(page);

    await waitForMiningActive(page, 120_000);
    await expect(page.locator('[data-testid="mining-button-pause"]')).toBeVisible();

    await clickStopMining(page);
    await waitForMiningStopped(page, 60_000);
    const startBtn = page.locator('[data-testid="mining-button-start"]');
    const resumeBtn = page.locator('[data-testid="mining-button-resume"]');
    await expect(startBtn.or(resumeBtn)).toBeVisible();
  });

  test('wallet shows balance after mining', async () => {
    await waitForMiningReady(page, 60_000);
    const balanceBefore = await getWalletBalance(page);

    await clickStartMining(page);
    await waitForMiningActive(page);

    const balance = await waitForWalletBalance(page, balanceBefore + 0.01, 120_000);
    expect(balance).toBeGreaterThan(balanceBefore);

    await clickStopMining(page);
    await waitForMiningStopped(page, 60_000);
  });
});
