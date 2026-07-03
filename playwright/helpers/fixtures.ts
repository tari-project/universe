import { test as base, Page } from '@playwright/test';
import { waitForTauriReady, waitForAppReady } from './state';
import { dismissDialogs, stopMiningDirect } from './wait-for';

/**
 * Per-test isolation fixture.
 *
 * Every test gets a FRESH browser context and page. The page connects its
 * own WebSocket to the backend; the headless state replay (on connect and
 * on frontend_ready) populates the Zustand store with the current real
 * backend state, so a fresh page is fully usable within seconds.
 *
 * What is isolated per test: the DOM, the frontend store, the WebSocket.
 * What persists across tests: the backend (node, wallet, chain state).
 * Tests must therefore create their own preconditions (e.g. mine if a
 * balance is needed) and never rely on a previous test's UI state.
 *
 * Teardown stops mining (best-effort, direct invoke — cleanup only, never
 * an assertion path) so a failed test can't leave miners running for the
 * next one, then closes the context.
 */
export const test = base.extend<{ appPage: Page }>({
  appPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('http://localhost:1420/');
    await waitForTauriReady(page);
    await waitForAppReady(page);
    await dismissDialogs(page);

    await use(page);

    // Backstop: never leak a running miner into the next test, even when
    // this test failed mid-flow. UI state needs no cleanup — the context
    // is discarded.
    await stopMiningDirect(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
