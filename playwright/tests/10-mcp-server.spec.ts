import { test, expect } from '../helpers/fixtures';
import { sel } from '../helpers/selectors';
import { openSettingsTab, setToggleState } from '../helpers/settings';
import { McpClient, waitForMcpUp, waitForMcpDown } from '../helpers/mcp-client';
import { waitForMiningReady, waitForMiningActive, waitForMiningStopped } from '../helpers/wait-for';
import type { Page } from '@playwright/test';

const MCP_PORT = 19222;
const ALT_PORT = 19223;
const baseUrl = (port: number) => `http://127.0.0.1:${port}`;

async function waitForServerStatus(page: Page, pattern: RegExp, timeout = 30_000) {
  await expect(page.locator(sel.mcp.serverStatus)).toHaveText(pattern, { timeout });
}

/**
 * The MCP server is Tari Universe's surface for EXTERNAL agents, so these
 * tests exercise it the way an agent would — raw HTTP from the test
 * process — while asserting the in-app settings UI stays truthful.
 *
 * Serial: the flow enables the server once, captures the token, and later
 * steps depend on it. No PIN exists yet (the PIN spec runs last), so
 * token reveal works without a gate here; the gated variants live in
 * 95-security-pin.
 */
test.describe.serial('MCP Server', () => {
  let token = '';

  test('enabling the server generates a redacted token and reports the port', async ({ appPage: page }) => {
    await openSettingsTab(page, 'mcp');

    const toggle = page.locator(sel.mcp.serverToggle);
    await toggle.waitFor({ state: 'visible', timeout: 15_000 });
    await expect(toggle).not.toBeChecked(); // off by default

    await setToggleState(page, sel.mcp.serverToggle, true);
    await waitForServerStatus(page, new RegExp(`running.*${MCP_PORT}`, 'i'));
    // Gate on the real listener, not just the UI status text: later tests
    // (and the token below) act against the socket.
    await waitForMcpUp(MCP_PORT, 30_000);

    // Token renders redacted: tu_ prefix + bullets, no full token in the DOM.
    const tokenValue = page.locator(sel.mcp.tokenValue);
    await tokenValue.waitFor({ state: 'visible', timeout: 10_000 });
    const redacted = (await tokenValue.textContent()) ?? '';
    expect(redacted).toMatch(/^tu_/);
    expect(redacted).toContain('•');
  });

  test('reveal and copy expose the full bearer token (no PIN set yet)', async ({ appPage: page }) => {
    await openSettingsTab(page, 'mcp');

    await page.locator(sel.mcp.tokenReveal).click({ timeout: 10_000 });
    const tokenValue = page.locator(sel.mcp.tokenValue);
    await expect(tokenValue).toHaveText(/^tu_[A-Za-z0-9_-]{16,}$/, { timeout: 15_000 });
    token = ((await tokenValue.textContent()) ?? '').trim();
    expect(token).not.toContain('•');

    await page.locator(sel.mcp.tokenCopy).click({ timeout: 5_000 });
    const clipboard = await page.evaluate(
      () => (window as unknown as { __PLAYWRIGHT_CLIPBOARD__?: string }).__PLAYWRIGHT_CLIPBOARD__ ?? ''
    );
    expect(clipboard).toBe(token);
  });

  test('missing or wrong bearer token is rejected with 401', async () => {
    const noToken = new McpClient(baseUrl(MCP_PORT));
    const resNone = await noToken.rawPost({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });
    expect(resNone.status).toBe(401);

    const badToken = new McpClient(baseUrl(MCP_PORT), 'tu_definitely-not-the-token');
    const resBad = await badToken.rawPost({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });
    expect(resBad.status).toBe(401);
  });

  test('an authenticated agent lists tools and calls read-tier tools', async () => {
    expect(token, 'token captured by the reveal test').toMatch(/^tu_/);
    const client = new McpClient(baseUrl(MCP_PORT), token);
    await client.initialize();

    const tools = await client.listTools();
    for (const expected of [
      'get_wallet_address',
      'get_wallet_balance',
      'get_transaction_history',
      'get_chain_status',
      'get_network_info',
      'get_mining_status',
      'start_mining',
      'stop_mining',
      'send_transaction',
    ]) {
      expect(tools).toContain(expected);
    }

    const balance = await client.callTool('get_wallet_balance');
    expect(balance.isError).toBe(false);
    expect(balance.text.length).toBeGreaterThan(0);

    const chain = await client.callTool('get_chain_status');
    expect(chain.isError).toBe(false);
  });

  test('control tier drives mining and the app UI reflects it', async ({ appPage: page }) => {
    test.setTimeout(480_000);
    expect(token).toMatch(/^tu_/);
    await waitForMiningReady(page, 120_000);

    const client = new McpClient(baseUrl(MCP_PORT), token);
    await client.initialize();

    const started = await client.callTool('start_mining', {}, 60_000);
    expect(started.isError).toBe(false);
    // The real cross-check: the app's own UI shows mining running.
    await waitForMiningActive(page, 120_000);

    const stopped = await client.callTool('stop_mining', {}, 60_000);
    expect(stopped.isError).toBe(false);
    await waitForMiningStopped(page, 60_000);
  });

  test('disabling the read tier blocks read tools until re-enabled', async ({ appPage: page }) => {
    expect(token).toMatch(/^tu_/);
    await openSettingsTab(page, 'mcp');
    const readTier = page.locator(sel.mcp.tierRead);
    await readTier.waitFor({ state: 'visible', timeout: 15_000 });
    await expect(readTier).toBeChecked();

    const client = new McpClient(baseUrl(MCP_PORT), token);
    await client.initialize();

    await setToggleState(page, sel.mcp.tierRead, false);

    const blocked = await client.callTool('get_wallet_balance');
    expect(blocked.isError).toBe(true);
    expect(blocked.text).toMatch(/read tier is disabled/i);

    await setToggleState(page, sel.mcp.tierRead, true);

    const allowed = await client.callTool('get_wallet_balance');
    expect(allowed.isError).toBe(false);
  });

  test('changing the port moves the server; the token survives', async ({ appPage: page }) => {
    test.setTimeout(240_000);
    expect(token).toMatch(/^tu_/);
    await openSettingsTab(page, 'mcp');

    const portInput = page.locator(sel.mcp.portInput);
    await portInput.waitFor({ state: 'visible', timeout: 15_000 });
    await portInput.fill(String(ALT_PORT));
    await portInput.press('Enter');
    await waitForServerStatus(page, new RegExp(`running.*${ALT_PORT}`, 'i'), 60_000);

    // Wait for the real listeners to settle: the new port must be up and the
    // old one refused before we probe them (the socket lags the UI text).
    await waitForMcpUp(ALT_PORT, 60_000);
    await waitForMcpDown(MCP_PORT, 60_000);

    const client = new McpClient(baseUrl(ALT_PORT), token);
    await client.initialize();
    expect(await client.listTools()).toContain('get_wallet_balance');

    // Restore the default port and confirm it is actually serving again, so
    // the following tests start from a live socket on MCP_PORT.
    await portInput.fill(String(MCP_PORT));
    await portInput.press('Enter');
    await waitForServerStatus(page, new RegExp(`running.*${MCP_PORT}`, 'i'), 60_000);
    await waitForMcpUp(MCP_PORT, 60_000);
    await waitForMcpDown(ALT_PORT, 60_000);
  });

  test('revoke clears the token, disables MCP and stops the server', async ({ appPage: page }) => {
    await openSettingsTab(page, 'mcp');

    // Revoke asks via a native confirm().
    page.on('dialog', (dialog) => dialog.accept());
    await page.locator(sel.mcp.tokenRevoke).click({ timeout: 10_000 });

    await expect(page.locator(sel.mcp.serverToggle)).not.toBeChecked({ timeout: 15_000 });
    await expect(page.locator(sel.mcp.tokenValue)).not.toBeVisible({ timeout: 10_000 });

    // The server is really gone (poll until the listener actually stops).
    await waitForMcpDown(MCP_PORT, 30_000);
  });
});
