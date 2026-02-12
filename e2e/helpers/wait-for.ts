import { Page } from '@playwright/test';
import { sel } from './selectors';
// ---------------------------------------------------------------------------
// Internal: invoke a Tauri backend command via the E2E bridge.
// Only use for polling production commands (e.g. get_base_node_status).
// NEVER add test-specific backend commands – see e2e/README.md.
// ---------------------------------------------------------------------------
async function invoke(page: Page, cmd: string, args: Record<string, unknown> = {}) {
  return page.evaluate(
    async ([command, payload]) => {
      const fn = (window as any).__E2E_INVOKE__;
      if (typeof fn !== 'function') {
        throw new Error('Tauri invoke not available - call waitForTauriReady first');
      }
      return fn(command, payload);
    },
    [cmd, args] as const
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ===========================================================================
// Polling helpers (use existing production commands / DOM reads)
// ===========================================================================

/** Wait until the base node reports is_synced === true. */
export async function waitForNodeSynced(page: Page, timeout = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const status = (await invoke(page, 'get_base_node_status')) as { is_synced?: boolean };
      if (status?.is_synced === true) return status;
    } catch {
      // node not ready yet
    }
    await sleep(500);
  }
  throw new Error(`Base node did not sync within ${timeout}ms`);
}

/** Wait for block height to increase from the given baseline, confirming mining is active. */
export async function waitForCpuMiningActive(page: Page, timeout = 60_000) {
  // Get current height, then wait for it to increase
  const start = Date.now();
  let baseline = 0;
  while (Date.now() - start < timeout) {
    try {
      const status = (await invoke(page, 'get_base_node_status')) as { block_height?: number };
      if (baseline === 0) {
        baseline = status?.block_height ?? 0;
      } else if ((status?.block_height ?? 0) > baseline) {
        return;
      }
    } catch {
      // not ready yet
    }
    await sleep(1_000);
  }
  throw new Error(`Mining did not produce new blocks within ${timeout}ms`);
}

/** Wait until the block height reported by the backend reaches minHeight. */
export async function waitForBlockHeight(page: Page, minHeight: number, timeout = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const status = (await invoke(page, 'get_base_node_status')) as { block_height?: number };
      const height = status?.block_height ?? 0;
      if (height >= minHeight) return height;
    } catch {
      // node not ready yet
    }
    await sleep(500);
  }
  throw new Error(`Block height did not reach ${minHeight} within ${timeout}ms`);
}

/** Wait until the wallet balance shown in the UI reaches minBalance. */
export async function waitForWalletBalance(page: Page, minBalance: number, timeout = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const text = await page.locator(sel.wallet.balance).textContent({ timeout: 1_000 });
      const cleaned = (text ?? '').replace(/[^0-9.]/g, '');
      const balance = parseFloat(cleaned);
      if (!isNaN(balance) && balance >= minBalance) return balance;
    } catch {
      // element not visible yet
    }
    await sleep(2_000);
  }
  throw new Error(`Wallet balance did not reach ${minBalance} within ${timeout}ms`);
}

// ===========================================================================
// UI setup helpers – dismiss dialogs, open panels
// ===========================================================================

/** Dismiss the Release Notes dialog if it appears. */
export async function dismissDialogs(page: Page) {
  const dismiss = page.locator(sel.dialogs.releaseNotesDismiss);
  try {
    await dismiss.click({ timeout: 2_000 });
  } catch {
    // dialog not present – nothing to dismiss
  }
}

/** Open the mining sidebar by clicking the mine icon (if not already open). */
export async function openMiningSidebar(page: Page) {
  const startBtn = page.locator(sel.mining.startButton);

  // If the start button is already visible, the sidebar is open
  if (await startBtn.isVisible().catch(() => false)) return;

  await page.locator(sel.sidebar.mineButton).click({ timeout: 5_000 });
  // Wait for the sidebar animation to complete — use a short poll
  // since multiple mining buttons may exist (start/pause via AnimatePresence)
  await page.waitForTimeout(1_000);
}

// ===========================================================================
// UI interaction helpers – click real buttons
// ===========================================================================

/** Wait for the mining start/resume button to become enabled.
 *  The button is disabled while setup modules (CPU/GPU mining, wallet) are still initializing. */
async function waitForMiningButtonEnabled(page: Page, timeout = 60_000) {
  const start = page.locator(`${sel.mining.startButton}:not([disabled])`);
  const resume = page.locator(`${sel.mining.resumeButton}:not([disabled])`);
  const btn = start.or(resume);
  await btn.waitFor({ state: 'visible', timeout });
}

/** Click the Start / Resume mining button. Waits for setup to complete and
 *  the button to become enabled (setup phases, wallet loading, etc.). */
export async function clickStartMining(page: Page) {
  await openMiningSidebar(page);
  await waitForMiningButtonEnabled(page);
  const start = page.locator(sel.mining.startButton);
  const resume = page.locator(sel.mining.resumeButton);
  const btn = start.or(resume);
  await btn.click({ timeout: 5_000 });
}

/** Click Pause → Stop (until restart) to stop mining via the UI.
 *  Waits up to 30s for the pause button to become visible (mining must be active). */
export async function clickStopMining(page: Page) {
  await openMiningSidebar(page);
  await page.locator(sel.mining.pauseButton).click({ timeout: 30_000 });
  await page.locator(sel.mining.stopOption).click({ timeout: 5_000 });
}

/**
 * Select a mining mode via the UI dropdown.
 * Handles the Ludicrous confirmation dialog automatically.
 * For Custom mode this only opens the dialog – use setSliderValue + clickCustomSave after.
 */
export async function clickMiningMode(page: Page, mode: string) {
  await openMiningSidebar(page);
  await waitForMiningButtonEnabled(page);
  // Multiple mode triggers exist (start/pause button variants via Activity).
  // Click the first visible one.
  await page.locator(sel.mode.trigger).first().click({ timeout: 5_000 });
  await page.locator(sel.mode.option(mode)).first().click({ timeout: 5_000 });

  if (mode === 'Ludicrous') {
    await page.locator(sel.mode.ludicrousConfirm).click({ timeout: 5_000 });
    // Wait for the confirmation dialog overlay to fully close
    await page.waitForTimeout(1_000);
  }
}

/** Click the Save / Use Custom button in the custom power levels dialog. */
export async function clickCustomSave(page: Page) {
  await page.locator(sel.mode.customSave).click({ timeout: 5_000 });
}

/**
 * Set a slider to approximately `targetValue` by clicking at the right position.
 * The slider maps [minValue, maxValue] linearly across its width.
 */
export async function setSliderValue(
  page: Page,
  sliderSelector: string,
  targetValue: number,
  minValue = 1,
  maxValue = 100
) {
  const slider = page.locator(sliderSelector);
  const box = await slider.boundingBox();
  if (!box) throw new Error(`Slider ${sliderSelector} not found or not visible`);

  const fraction = (targetValue - minValue) / (maxValue - minValue);
  const x = box.x + box.width * fraction;
  const y = box.y + box.height / 2;
  await page.mouse.click(x, y);
}

/** Read the "Current mode" details text from the custom power levels dialog. */
export async function getCustomModeDetails(page: Page): Promise<string> {
  return (await page.locator(sel.mode.customModeDetails).textContent({ timeout: 5_000 })) ?? '';
}

// ===========================================================================
// Cleanup helpers – use invoke for reliable teardown regardless of UI state
// ===========================================================================

/**
 * Stop CPU mining via direct invoke. Used in afterEach for reliable cleanup
 * even when the UI is in an unexpected state.
 */
export async function stopCpuMining(page: Page) {
  try {
    await invoke(page, 'stop_cpu_mining');
  } catch {
    // best-effort cleanup
  }
}
