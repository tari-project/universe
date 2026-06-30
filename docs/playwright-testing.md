# Playwright Testing

End-to-end tests for Tari Universe using Playwright + tauri-remote-ui. Tests run against the real backend in headless mode on localnet, interacting with the actual UI served by Vite.

## How it works

The app launches with `--headless` which activates headless mode:

1. **No native window** — the Tauri webview exists but doesn't display. `tauri-remote-ui` exposes the app's IPC over a WebSocket on port 9515.
2. **Vite dev server** — serves the frontend at `localhost:1420` with import aliases that redirect `@tauri-apps/api/*` to shim files. These shims bridge `invoke()` and `listen()` calls over the remote-ui WebSocket instead of Tauri's native IPC.
3. **Playwright's Chromium** connects to `localhost:1420`, loads the React app, and interacts with it like a user would.

The backend runs a real localnet node, wallet, merge mining proxy, and xmrig. Mining produces real blocks. Wallet balances are real. Nothing is mocked except the OS keychain (via `keyring::mock`).

## Application code changes

The `test-mode` Cargo feature gates exactly two things:

```toml
# src-tauri/Cargo.toml
[features]
test-mode = ["tauri-remote-ui"]
```

1. **Keychain mock** — `keyring::set_default_credential_builder(keyring::mock::default_credential_builder())` so the app doesn't touch the real OS keychain during tests.
2. **`tauri-remote-ui` plugin registration** — `builder.plugin(tauri_remote_ui::init())` so the WebSocket bridge is available.

Production builds omit both. The `--headless` CLI flag (defined in `tauri.conf.json`) controls runtime behavior:

- Starts remote-ui on port 9515 with `enable_application_ui()` (the webview stays untouched — no redirect)
- Sets `FrontendReadyChannel` ready immediately (no webview to wait for)
- Prevents Tauri's auto-exit when no windows are focused (`api.prevent_exit()` in the `ExitRequested` handler)
- Skips the macOS "not in Applications folder" check in debug builds

Two `.expect()` calls were changed to `if let Some(...)` in `websocket_manager.rs` and `setup_manager.rs` so the app doesn't panic when there's no webview window. These are safe no-ops — the webview listeners are only needed when a native window exists.

### `data-testid` attributes

Components that tests interact with have `data-testid` attributes. These are the **only** stable contract between the UI and the test suite. All existing test IDs are centralized in `playwright/helpers/selectors.ts` — check there for what's available.

Any new UI element that tests need to interact with must have a `data-testid`. This is the path forward for all future test coverage. Class names, DOM structure, and component hierarchy can change freely — `data-testid` is what tests rely on.

## Writing tests

### The golden rule: test the UI, not the backend

Tests should interact with what the user sees and does. Click buttons, read text, wait for visual state changes. Never call `invoke()` to check backend state. Never intercept WebSocket events to determine if something happened. If the UI doesn't reflect a state change, that's a bug in the app — not something to work around in the test.

```typescript
// GOOD — reads the wallet balance from the DOM
const balance = await getWalletBalance(page);
expect(balance).toBeGreaterThan(0);

// BAD — calls the backend directly
const status = await page.evaluate(async () => {
  return await window.__PLAYWRIGHT_INVOKE__('get_wallet_balance');
});
```

```typescript
// GOOD — waits for the pause button to appear (visual confirmation mining started)
await clickStartMining(page);
await waitForMiningActive(page);

// BAD — polls the backend to check if mining is running
await invoke('start_cpu_mining');
while (!(await invoke('get_mining_status')).is_mining) { ... }
```

### The app is heavy — always poll with timeouts

Tari Universe runs a full node, wallet, merge mining proxy, and xmrig. Things take time:

- **Node sync**: up to 30s on localnet
- **Mining module initialization**: depends on setup phases completing in sequence
- **Wallet scan**: scans all blocks before showing balance, can take 30-60s
- **Button state transitions**: Start → Loading (animated dots) → Pause involves backend round-trips
- **framer-motion animations**: buttons fade in/out with opacity transitions

Every interaction needs a wait function with a generous timeout. Use the helpers in `playwright/helpers/wait-for.ts`:

```typescript
// Wait for the app to be ready before doing anything
await waitForMiningReady(page, 120_000);

// After clicking start, wait for the visual transition to complete
await clickStartMining(page);
await waitForMiningActive(page, 120_000);

// After stopping, wait for the button to transition back
await clickStopMining(page);
await waitForMiningStopped(page, 60_000);

// Wallet balance takes time — scan must complete, then balance renders
const balance = await waitForWalletBalance(page, 0.01, 120_000);
```

When writing a new wait function, follow this pattern:

```typescript
export async function waitForSomething(page: Page, timeout = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    // Read from the DOM, not from the backend
    const value = await page.locator('[data-testid="something"]')
      .textContent({ timeout: 2_000 }).catch(() => null);

    if (value && meetsCondition(value)) return value;
    await page.waitForTimeout(2_000);
  }
  throw new Error(`Condition not met within ${timeout}ms`);
}
```

### Shared page pattern

All tests in a file share one browser context and page. This is required because `tauri-remote-ui` panics when a WebSocket connection closes, permanently killing event forwarding. By keeping one page alive for the entire test run, the WebSocket stays open.

```typescript
let context: BrowserContext;
let page: Page;

test.beforeAll(async ({ browser }) => {
  context = await browser.newContext();
  page = await context.newPage();
  await page.goto('http://localhost:1420/');
  await waitForTauriReady(page);
  await dismissDialogs(page);
});

test.afterAll(async () => {
  await context?.close();
});
```

This means tests within a describe block run sequentially and share state. Design tests to be order-independent where possible, but know that the page state carries over.

### Adding `data-testid` to a component

When you need to target a new UI element:

1. Add `data-testid="descriptive-name"` to the JSX element
2. Add the selector to `playwright/helpers/selectors.ts`
3. Write a wait/interaction helper in `playwright/helpers/wait-for.ts`
4. Use the helper in your test

```tsx
// In the React component
<Button data-testid="settings-save" onClick={handleSave}>Save</Button>
```

```typescript
// In selectors.ts
export const sel = {
  settings: {
    saveButton: '[data-testid="settings-save"]',
  },
  // ...
};
```

Keep test IDs stable. They're a public contract. If you rename one, update `selectors.ts` and all tests that use it.

### Handling framer-motion animations

Many components use framer-motion for enter/exit animations. Playwright's default `click()` waits for the element to be "stable" (not animating), which can fail during opacity transitions.

Two strategies:

1. **`dispatchEvent('click')`** — fires the click without waiting for stability. Used for buttons wrapped in `AnimatePresence`:
   ```typescript
   await btn.dispatchEvent('click');
   ```

2. **`{ force: true }`** — skips actionability checks. Used for elements that are visible but mid-animation:
   ```typescript
   await btn.click({ force: true });
   ```

Prefer `dispatchEvent` for React buttons. It triggers the synthetic event system more reliably.

### Dismissing dialogs

The app shows dialogs (release notes, ludicrous mode confirmation) that overlay the UI. Dismiss them early:

```typescript
await dismissDialogs(page);
```

If your test triggers a new dialog, handle it before proceeding:

```typescript
await clickSomethingThatOpensDialog(page);
const confirm = page.locator('[data-testid="dialog-confirm"]');
await confirm.click({ timeout: 5_000 });
```

## Running tests

```bash
# First time setup
npm run playwright:install

# Build the binary (takes a few minutes)
cargo tauri build --debug --no-bundle --features test-mode

# Run tests (launches vite + backend automatically)
npm run playwright

# Run with pre-built binary (skip rebuild)
SKIP_BUILD=1 npm run playwright

# Headed mode (see the browser)
SKIP_BUILD=1 npm run playwright:headed

# Playwright UI mode (interactive test runner)
SKIP_BUILD=1 npm run playwright:ui
```

### Pre-seeded config

Global setup writes config files to the localnet app data directory before launching the backend:

- `config_pools.json` — pools disabled (solo mining only)
- `config_core.json` — local node, auto-update off, tor disabled
- `config_mining.json` — CPU mining enabled, GPU disabled, `mine_on_app_start: false`

`mine_on_app_start` must be `false` so the app doesn't auto-start mining before tests are ready. Tests control when mining starts via UI interactions.

### Cleanup between runs

The global teardown kills the Tauri process and Vite server. If a run crashes, you may need to manually clean up:

```bash
# Kill leftover processes
pkill -f "Tari Universe"
pkill -f "vite.*playwright"
lsof -ti:1420,9515 | xargs kill -9
```

## File layout

```
playwright/
├── playwright.config.ts      # Single project, workers: 1, 180s timeout
├── package.json               # Playwright + TypeScript deps
├── tsconfig.json
├── helpers/
│   ├── global-setup.ts        # Builds binary, starts vite + backend, pre-seeds config
│   ├── global-teardown.ts     # Kills processes
│   ├── shared-page.ts         # Worker-scoped fixture (unused, using beforeAll pattern)
│   ├── selectors.ts           # data-testid → CSS selector map
│   ├── state.ts               # waitForTauriReady (polls for WS bridge availability)
│   └── wait-for.ts            # UI interaction + polling helpers
├── shims/                     # Vite aliases redirect @tauri-apps/api/* here
│   ├── tauri-remote-ui-socket.ts  # WebSocket client to :9515
│   ├── tauri-api-core.ts          # invoke() over WebSocket
│   ├── tauri-api-event.ts         # listen() via WebSocket events
│   ├── tauri-window.ts            # stub getCurrentWindow()
│   ├── tauri-webview-window.ts    # stub getCurrentWebviewWindow()
│   └── tauri-plugin-*.ts          # stubs for clipboard, dialog, os, shell
└── tests/
    └── mining-flow.spec.ts    # Mining lifecycle tests
```

The `vite.config.playwright.ts` at the repo root defines the import aliases that point `@tauri-apps/api/*` to the shim files.
