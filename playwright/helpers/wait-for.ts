import { Page } from '@playwright/test';
import { sel } from './selectors';

// ===========================================================================
// UI state helpers — wait for visual transitions, not backend calls
// ===========================================================================

/** Open the mining sidebar by clicking the mine icon (if not already open). */
export async function openMiningSidebar(page: Page, timeout = 30_000) {
  const mineButton = page.locator(sel.sidebar.mineButton);
  // NOTE: start/resume and pause are BOTH kept mounted (React <Activity>),
  // with the inactive one hidden — so never use .first() on this list; ask
  // whether ANY of them is visible.
  const anyVisibleButton = page.locator(
    `${sel.mining.startButton}:visible, ${sel.mining.resumeButton}:visible, ${sel.mining.pauseButton}:visible`
  );
  // The mine button TOGGLES the sidebar, so blind re-clicks can close what
  // a previous click opened. Read the real open state from data-active and
  // only click when it says closed; when open, just wait out the animation.
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if ((await anyVisibleButton.count().catch(() => 0)) > 0) return;
    const active = await mineButton.getAttribute('data-active').catch(() => null);
    if (active !== 'true') {
      await mineButton.click({ timeout: 10_000 }).catch(() => {});
    }
    await page.waitForTimeout(1_000);
  }
  throw new Error(`Mining sidebar did not open within ${timeout}ms`);
}

/**
 * Wait for the mining start or resume button to be visible and enabled.
 * This indicates that all setup phases have completed and mining is unlocked.
 *
 * The button enables when the backend emits real UpdateAppModuleStatus
 * events. Late-joining pages receive them via the headless state replay
 * (on WS connect and on frontend_ready) — no synthetic events needed.
 * If this times out, the backend genuinely isn't ready: check module
 * status in the backend logs rather than working around it here.
 */
export async function waitForMiningReady(page: Page, timeout = 120_000) {
  await openMiningSidebar(page);
  const start = page.locator(`${sel.mining.startButton}:not([disabled])`);
  const resume = page.locator(`${sel.mining.resumeButton}:not([disabled])`);
  const btn = start.or(resume);

  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await btn.isVisible().catch(() => false)) return;
    await page.waitForTimeout(1_000);
  }
  throw new Error(`Mining button not ready within ${timeout}ms`);
}

/**
 * Click Start/Resume and converge until mining actually reacts.
 * A single Playwright click can land on a node that AnimatePresence
 * remounts before React's handler fires (observed: 3 "successful" clicks,
 * zero start_cpu_mining invokes) — so keep dispatching until the pause
 * button materializes. dispatchEvent is the reliable path for these
 * framer-motion buttons (per the harness docs).
 */
export async function clickStartMining(page: Page, timeout = 60_000) {
  const start = page.locator(sel.mining.startButton);
  const resume = page.locator(sel.mining.resumeButton);
  const pause = page.locator(sel.mining.pauseButton);
  const btn = start.or(resume);

  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await pause.isVisible().catch(() => false)) return;
    // A registered click flips the button into its disabled/loading state
    // while the miner spins up — do NOT dispatch again then: every extra
    // click queues another start_cpu_mining invoke, and stale ones landing
    // after a later stop resurrect mining behind the test's back.
    const registered = await btn.isDisabled().catch(() => false);
    if (!registered) {
      await btn.dispatchEvent('click').catch(() => {});
    }
    await page.waitForTimeout(2_000);
  }
  throw new Error(`Mining did not react to start clicks within ${timeout}ms`);
}

/**
 * Wait for the Pause button to appear, indicating mining is actively running.
 * The button transitions: Start → Loading (dots) → Pause.
 */
export async function waitForMiningActive(page: Page, timeout = 60_000) {
  await page.locator(sel.mining.pauseButton).waitFor({ state: 'visible', timeout });
}

/**
 * Stop mining via the UI (Pause → "Pause until I Restart").
 * State-aware: if the start/resume button is showing — including the
 * transient stopped-looking window while the watcher restarts a stalled
 * miner — there is nothing to click; the fixture's teardown invoke
 * backstops any restart that lands afterwards.
 */
export async function clickStopMining(page: Page) {
  // The sidebar can close during long condition waits — make sure the
  // controls are on screen before interacting.
  await openMiningSidebar(page);
  const pauseButton = page.locator(sel.mining.pauseButton);
  const stopOption = page.locator(sel.mining.stopOption);
  const startOrResume = page.locator(
    `${sel.mining.startButton}:visible, ${sel.mining.resumeButton}:visible`
  );

  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (await pauseButton.isVisible().catch(() => false)) {
      // The dropdown can render slower than the click under load; the
      // click toggles the menu, so retry converges.
      await pauseButton.click({ timeout: 10_000, force: true }).catch(() => {});
      const visible = await stopOption
        .waitFor({ state: 'visible', timeout: 5_000 })
        .then(() => true, () => false);
      if (visible) {
        await stopOption.click({ timeout: 5_000 });
        return;
      }
      continue;
    }
    if ((await startOrResume.count().catch(() => 0)) > 0) {
      // Already stopped (or mid miner-restart) — nothing to click.
      return;
    }
    await page.waitForTimeout(1_000);
  }
  throw new Error('Could not stop mining within 60s (no pause or start button)');
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

/** Read the current wallet balance from the UI. Returns 0 if not yet rendered.
 *  Reads data-balance-total (live calculated balance) which updates even during
 *  wallet scanning, unlike the displayed balance which freezes to a cached value.
 */
export async function getWalletBalance(page: Page): Promise<number> {
  try {
    // Prefer the live total which updates during scanning
    const total = await page.locator(sel.wallet.balance).getAttribute('data-balance-total', { timeout: 2_000 });
    if (total) {
      const value = parseFloat(total);
      if (!isNaN(value) && value > 0) return value;
    }
    // Fall back to displayed balance (frozen during scanning)
    const raw = await page.locator(sel.wallet.balance).getAttribute('data-balance', { timeout: 2_000 });
    if (raw) {
      const value = parseFloat(raw);
      if (!isNaN(value)) return value;
    }
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

/**
 * Wait for the wallet scan to complete. The "My balance" label can render
 * alongside the scanning indicator, so the reliable signal is the
 * "Wallet is loading NN%" text DISAPPEARING.
 */
export async function waitForWalletReady(page: Page, timeout = 120_000) {
  const loading = page.getByText(/Wallet is loading/i);
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const count = await loading.count().catch(() => 1);
    if (count === 0) return;
    await page.waitForTimeout(2_000);
  }
  throw new Error(`Wallet scan did not complete within ${timeout}ms`);
}

/**
 * Mine until the wallet balance exceeds `target`, then stop mining.
 *
 * The balance tracks the WALLET SCAN, and the scanner cannot converge
 * while localnet keeps producing a block every second or two — it chases
 * a moving tip indefinitely. So: mine a short burst (with a fast-path
 * balance check), STOP, and then wait for the scanner to catch up to the
 * now-static tip.
 */
export async function mineUntilBalanceExceeds(page: Page, target: number, timeout = 300_000) {
  await waitForMiningReady(page, 120_000);
  await clickStartMining(page);
  await waitForMiningActive(page, 120_000);
  try {
    // Fast path: on a small chain the scan keeps up and the balance
    // crosses the target while mining.
    await waitForWalletBalance(page, target, 60_000);
  } catch {
    // Slow path: stop below and let the scanner converge.
  } finally {
    await clickStopMining(page);
    await waitForMiningStopped(page, 60_000);
  }
  await waitForWalletBalance(page, target, timeout);
}

/**
 * Make sure the wallet holds at least `min` XTM, mining to get there if
 * needed. Every test that needs funds creates its own — no dependence on
 * a previous test having mined.
 */
export async function ensureBalance(page: Page, min: number, timeout = 180_000): Promise<number> {
  // On a fresh page the balance element renders only after the state
  // replay lands — wait for it before reading, or a 0 misread triggers
  // pointless mining.
  await page
    .locator(sel.wallet.balance)
    .waitFor({ state: 'attached', timeout: 30_000 })
    .catch(() => {});
  const current = await getWalletBalance(page);
  if (current >= min) return current;
  await mineUntilBalanceExceeds(page, min, timeout);
  return getWalletBalance(page);
}

// ===========================================================================
// Dialog helpers
// ===========================================================================

/**
 * Dismiss the Release Notes dialog if it appears. With the state replay
 * excluding ShowReleaseNotes, fresh pages should never see it — this is a
 * short defensive check, not a wait.
 */
export async function dismissDialogs(page: Page) {
  const dismiss = page.locator(sel.dialogs.releaseNotesDismiss);
  try {
    await dismiss.waitFor({ state: 'visible', timeout: 3_000 });
    await dismiss.click({ timeout: 5_000 });
    // Wait for dialog to fully close
    await dismiss.waitFor({ state: 'hidden', timeout: 5_000 });
  } catch {
    // dialog not present – nothing to dismiss
  }
}

// ===========================================================================
// Cleanup — direct invoke for reliable teardown only
// ===========================================================================

/**
 * Stop all mining via direct invoke. Fixture-teardown backstop ONLY —
 * never call this from a test body; tests stop mining through the UI.
 */
export async function stopMiningDirect(page: Page) {
  try {
    await page.evaluate(async () => {
      const fn = (window as any).__PLAYWRIGHT_INVOKE__;
      if (typeof fn !== 'function') return;
      await Promise.allSettled([fn('stop_cpu_mining'), fn('stop_gpu_mining')]);
    });
  } catch {
    // best-effort cleanup
  }
}
