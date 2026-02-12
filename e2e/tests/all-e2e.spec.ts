import { test, expect, Page, BrowserContext } from '@playwright/test';
import { initReadinessMarker, waitForTauriReady } from '../helpers/state';
import {
  waitForNodeSynced,
  waitForBlockHeight,
  clickStartMining,
  clickStopMining,
  stopCpuMining,
  waitForCpuMiningActive,
  waitForWalletBalance,
  dismissDialogs,
  clickMiningMode,
  clickCustomSave,
  setSliderValue,
  getCustomModeDetails,
} from '../helpers/wait-for';
import { sel } from '../helpers/selectors';

/**
 * All E2E tests in a single file sharing one browser context and page.
 *
 * The Tauri remote-ui backend panics when a WebSocket connection closes,
 * permanently killing event forwarding. By sharing a single page across
 * all tests, we keep the WebSocket alive for the entire run.
 */

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

// ---------------------------------------------------------------------------
// Full E2E Flow
// ---------------------------------------------------------------------------

test.describe('Full E2E Flow', () => {
  test('complete flow: launch → sync → mine → earn', async () => {
    try {
      const nodeStatus = await waitForNodeSynced(page, 30_000);
      expect(nodeStatus.is_synced).toBe(true);

      await clickStartMining(page);

      const height = await waitForBlockHeight(page, 3, 30_000);
      expect(height).toBeGreaterThanOrEqual(3);

      const balance = await waitForWalletBalance(page, 0.001, 60_000);
      expect(balance).toBeGreaterThanOrEqual(0.001);
    } finally {
      await stopCpuMining(page);
    }
  });
});

// ---------------------------------------------------------------------------
// Real Node
// ---------------------------------------------------------------------------

test.describe('Real Node', () => {
  test('node starts and syncs on localnet', async () => {
    const nodeStatus = await waitForNodeSynced(page, 30_000);
    expect(nodeStatus.is_synced).toBe(true);
  });

  test('block height increases while mining', async () => {
    await waitForNodeSynced(page);
    await clickStartMining(page);
    try {
      const first = await waitForBlockHeight(page, 1);
      const next = await waitForBlockHeight(page, first + 1);
      expect(next).toBeGreaterThan(first);
    } finally {
      await stopCpuMining(page);
    }
  });
});

// ---------------------------------------------------------------------------
// Real Mining
// ---------------------------------------------------------------------------

test.describe('Real Mining', () => {
  test.afterEach(async () => {
    await stopCpuMining(page);
  });

  test('can start and stop CPU mining', async () => {
    await waitForNodeSynced(page);
    await clickStartMining(page);
    await waitForCpuMiningActive(page);
    await stopCpuMining(page);
  });

  test('block height increases while mining', async () => {
    await waitForNodeSynced(page);
    await clickStartMining(page);
    const first = await waitForBlockHeight(page, 1);
    const next = await waitForBlockHeight(page, first + 1);
    expect(next).toBeGreaterThan(first);
  });
});

// ---------------------------------------------------------------------------
// Real Wallet
// ---------------------------------------------------------------------------

test.describe('Real Wallet', () => {
  test.afterEach(async () => {
    await stopCpuMining(page);
  });

  test('wallet connects after node sync', async () => {
    await waitForNodeSynced(page);
    await expect(page).toHaveTitle(/Tari/i);
  });

  test('wallet balance increases after mining', async () => {
    await waitForNodeSynced(page);
    await clickStartMining(page);
    await waitForBlockHeight(page, 5);
    const balance = await waitForWalletBalance(page, 0.001, 60_000);
    expect(balance).toBeGreaterThanOrEqual(0.001);
  });
});

// ---------------------------------------------------------------------------
// Mining Modes
// ---------------------------------------------------------------------------
// Known limitation: ConfigMiningLoaded events may fire before the WebSocket
// client connects (race condition in E2E mode). When this happens, the
// mining mode dropdown is empty and mode-switching tests fail.
// These tests are skipped until tauri-remote-ui buffers events for late clients.
// ---------------------------------------------------------------------------

test.describe('Mining Modes', () => {
  test.afterEach(async () => {
    await stopCpuMining(page);
  });

  test.skip('can mine in Eco mode', async () => {
    await waitForNodeSynced(page);
    await clickMiningMode(page, 'Eco');
    await clickStartMining(page);
    const height = await waitForBlockHeight(page, 1);
    expect(height).toBeGreaterThanOrEqual(1);
  });

  test.skip('can mine in Ludicrous mode', async () => {
    await waitForNodeSynced(page);
    await clickMiningMode(page, 'Ludicrous');
    await clickStartMining(page);
    const height = await waitForBlockHeight(page, 1);
    expect(height).toBeGreaterThanOrEqual(1);
  });

  test.skip('custom settings persist across mode toggles', async () => {
    await waitForNodeSynced(page);
    await clickMiningMode(page, 'Custom');
    await setSliderValue(page, sel.mode.cpuSlider, 50);
    await setSliderValue(page, sel.mode.gpuSlider, 60);
    await clickCustomSave(page);

    await page.waitForTimeout(500);

    await clickMiningMode(page, 'Eco');
    await clickMiningMode(page, 'Custom');

    const details = await getCustomModeDetails(page);
    expect(details).toContain('CPU 50%');
    expect(details).toContain('GPU 60%');
  });
});
