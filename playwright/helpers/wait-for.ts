import { Page } from '@playwright/test';
import { sel } from './selectors';

// ===========================================================================
// UI state helpers — wait for visual transitions, not backend calls
// ===========================================================================

/** Open the mining sidebar by clicking the mine icon (if not already open). */
export async function openMiningSidebar(page: Page) {
  // If any mining button is already visible, the sidebar is open
  const anyButton = page.locator(
    `${sel.mining.startButton}, ${sel.mining.resumeButton}, ${sel.mining.pauseButton}`
  );
  if (await anyButton.first().isVisible().catch(() => false)) return;

  await page.locator(sel.sidebar.mineButton).click({ timeout: 10_000 });
  // Wait for sidebar animation to complete
  await anyButton.first().waitFor({ state: 'visible', timeout: 10_000 });
}

/**
 * Wait for the mining start or resume button to be visible and enabled.
 * This indicates that all setup phases have completed and mining is unlocked.
 */
export async function waitForMiningReady(page: Page, timeout = 120_000) {
  await openMiningSidebar(page);
  const start = page.locator(`${sel.mining.startButton}:not([disabled])`);
  const resume = page.locator(`${sel.mining.resumeButton}:not([disabled])`);
  const btn = start.or(resume);
  await btn.waitFor({ state: 'visible', timeout });
}

/** Click the Start or Resume mining button. Sidebar must already be open. */
export async function clickStartMining(page: Page) {
  const start = page.locator(sel.mining.startButton);
  const resume = page.locator(sel.mining.resumeButton);
  const btn = start.or(resume);

  // Retry click — framer-motion animations can cause the first attempt to
  // miss if the element is mid-opacity transition
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.waitForTimeout(1_000);
      await btn.click({ timeout: 10_000 });
      return;
    } catch {
      if (attempt === 2) throw new Error('Failed to click start/resume mining button after 3 attempts');
    }
  }
}

/**
 * Wait for the Pause button to appear, indicating mining is actively running.
 * The button transitions: Start → Loading (dots) → Pause.
 */
export async function waitForMiningActive(page: Page, timeout = 60_000) {
  await page.locator(sel.mining.pauseButton).waitFor({ state: 'visible', timeout });
}

/** Click Pause → "Pause until I Restart" to stop mining via the UI. */
export async function clickStopMining(page: Page) {
  await page.locator(sel.mining.pauseButton).click({ timeout: 30_000, force: true });
  await page.locator(sel.mining.stopOption).waitFor({ state: 'visible', timeout: 5_000 });
  await page.locator(sel.mining.stopOption).click({ timeout: 5_000 });
}

/**
 * Wait for the Start or Resume button to reappear after stopping mining.
 * The button transitions: Pause → Loading (dots) → Start/Resume.
 */
export async function waitForMiningStopped(page: Page, timeout = 30_000) {
  const start = page.locator(sel.mining.startButton);
  const resume = page.locator(sel.mining.resumeButton);
  const btn = start.or(resume);
  await btn.waitFor({ state: 'visible', timeout });
}

// ===========================================================================
// Wallet balance — read from the DOM, not from the API
// ===========================================================================

/** Parse the wallet balance number from the UI text content. */
function parseBalanceText(text: string | null): number {
  if (!text) return 0;
  // Text contains "NUMBER XTM" (possibly with commas) plus subtitle text.
  // Use regex to extract the first number followed by XTM.
  const match = text.match(/([\d,]+(?:\.\d+)?)\s*XTM/);
  if (!match) return 0;
  const value = parseFloat(match[1].replace(/,/g, ''));
  return isNaN(value) ? 0 : value;
}

/** Read the current wallet balance from the UI. Returns 0 if not yet rendered. */
export async function getWalletBalance(page: Page): Promise<number> {
  try {
    const text = await page.locator(sel.wallet.balance).textContent({ timeout: 2_000 });
    return parseBalanceText(text);
  } catch {
    return 0;
  }
}

/**
 * Wait until the wallet balance shown in the UI exceeds minBalance.
 * Reads the actual rendered DOM text — no backend calls.
 */
export async function waitForWalletBalance(page: Page, minBalance: number, timeout = 120_000) {
  const start = Date.now();
  let lastBalance = 0;
  while (Date.now() - start < timeout) {
    lastBalance = await getWalletBalance(page);
    if (lastBalance >= minBalance) return lastBalance;
    await page.waitForTimeout(2_000);
  }
  throw new Error(
    `Wallet balance did not reach ${minBalance} within ${timeout}ms (last seen: ${lastBalance})`
  );
}

/** Wait for the wallet balance loading indicator to disappear ("My balance" text visible). */
export async function waitForWalletReady(page: Page, timeout = 120_000) {
  // The bottom text shows "My balance" when scanning is complete
  const balanceLabel = page.locator(`${sel.wallet.balance} >> text=My balance`);
  await balanceLabel.waitFor({ state: 'visible', timeout });
}

// ===========================================================================
// Dialog helpers
// ===========================================================================

/** Dismiss the Release Notes dialog if it appears. */
export async function dismissDialogs(page: Page) {
  const dismiss = page.locator(sel.dialogs.releaseNotesDismiss);
  try {
    await dismiss.click({ timeout: 3_000 });
  } catch {
    // dialog not present – nothing to dismiss
  }
}

// ===========================================================================
// Cleanup — direct invoke for reliable teardown only
// ===========================================================================

/** Stop CPU mining via direct invoke. Used only for afterEach cleanup. */
export async function stopCpuMiningDirect(page: Page) {
  try {
    await page.evaluate(async () => {
      const fn = (window as any).__PLAYWRIGHT_INVOKE__;
      if (typeof fn === 'function') await fn('stop_cpu_mining');
    });
  } catch {
    // best-effort cleanup
  }
}
