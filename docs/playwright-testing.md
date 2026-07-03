# Playwright Testing

End-to-end tests for Tari Universe using Playwright + a vendored, patched `tauri-remote-ui`. Tests run against the real backend in headless mode on localnet, interacting with the actual UI served by Vite.

## How it works

The app launches with `--headless` (test-mode builds only):

1. **Remote IPC bridge** — the vendored `tauri-remote-ui` plugin (`src-tauri/tauri-remote-ui-patched/`) exposes the app's IPC over a WebSocket on port 9515. Multiple simultaneous connections are supported; backend events broadcast to all of them. (The app's own hidden webview still exists — the bridge routes invokes through it — which is why CI runs under `xvfb`.)
2. **Vite dev server** — serves the frontend at `localhost:1420` with import aliases that redirect `@tauri-apps/api/*` to shim files. These shims bridge `invoke()` and `listen()` calls over the remote-ui WebSocket instead of Tauri's native IPC.
3. **Playwright's Chromium** connects to `localhost:1420`, loads the React app, and interacts with it like a user would.

The backend runs a real localnet node, wallet, merge mining proxy, and xmrig. Mining produces real blocks. Wallet balances are real. Nothing is mocked except the OS keychain (file-backed credential store).

### State replay — how fresh pages see current state

Backend events are fire-once: configs load and modules initialize while setup runs, before any test page has connected. The headless layer (`src-tauri/src/headless.rs`) caches the **last real payload** of every replayable `backend_state_update` event and replays the snapshot:

- when a WebSocket client connects (covers mid-session reconnects), and
- when a page invokes `frontend_ready` (covers fresh page loads — fires after the frontend registered its listeners, so it's race-free).

Replayed events are real state, never synthesized. If a module failed during setup, a fresh page sees `Failed` — tests fail loudly instead of being fooled by a hardcoded `Initialized`. Never inject synthetic backend events from tests; if a fresh page doesn't converge to correct state, that's a replay bug to fix in `headless.rs`.

### Isolated test profile

Test-mode builds use the identifier `com.tari.universe.test` (via `tauri.test.conf.json` + `APPLICATION_FOLDER_ID`), so tests never touch a real Tari Universe profile. Global setup **wipes the test profile before every run** — each run starts at block 0 with the pre-seeded wallet. Set `KEEP_TEST_DATA=1` to keep the chain between local runs while iterating.

## Application code changes

The `test-mode` Cargo feature gates:

```toml
# src-tauri/Cargo.toml
[features]
test-mode = ["tauri-remote-ui"]

tauri-remote-ui = { path = "tauri-remote-ui-patched", optional = true }
```

1. **File-backed credential store** — replaces the OS keychain so runs are deterministic and headless.
2. **Vendored `tauri-remote-ui` plugin** — upstream 0.14.0 (the last MIT release; ≥1.0 is AGPL) plus patches: broadcast to all WS connections, no panic on peer disconnect, a `remote-ui://client-connected` event, and no panic when the main window is absent.
3. **State replay hook in `frontend_ready`** — replays the cached backend state to every newly loaded page.
4. **Test profile identifier** — `com.tari.universe.test` for all data dirs and the credential service name.

Production builds compile none of this in.

### `data-testid` attributes

Components that tests interact with have `data-testid` attributes. These are the **only** stable contract between the UI and the test suite. All existing test IDs are centralized in `playwright/helpers/selectors.ts` — check there for what's available.

Any new UI element that tests need to interact with must have a `data-testid`. Class names, DOM structure, and component hierarchy can change freely — `data-testid` is what tests rely on.

## Writing tests

### Isolation model: fresh page per test

Every test gets a **fresh browser context and page** via the `appPage` fixture:

```typescript
import { test, expect } from '../helpers/fixtures';

test('does something', async ({ appPage: page }) => {
  // page is freshly navigated, store populated via state replay,
  // dialogs dismissed. Interact away.
});
```

What is isolated per test: the DOM, the frontend store, the WebSocket connection.
What persists across tests: the **backend** (node, wallet, chain state — balances only grow within a run).

Rules that keep tests independent:

1. **Create your own preconditions.** Need funds? `await ensureBalance(page, 2)` — never rely on an earlier test having mined.
2. **Assert deltas, not absolutes.** `expect(balance).toBeGreaterThan(balanceBefore)`, never `toBe(25)`.
3. **Leave the backend quiet.** Tests that start mining stop it via the UI as part of the flow. The fixture also stops mining on teardown as a backstop (direct invoke — cleanup only).
4. **Genuinely sequential backend state gets `test.describe.serial`.** The exchange-miner flow mutates the backend wallet mode across steps; serial makes the chain explicit and skips the rest on failure instead of cascading.

### The golden rule: test the UI, not the backend

Tests interact with what the user sees and does. Click buttons, read text, wait for visual state changes. Never call `invoke()` to check backend state. Never inject synthetic events. If the UI doesn't reflect a state change, that's a bug in the app — not something to work around in the test.

```typescript
// GOOD — reads the wallet balance from the DOM
const balance = await getWalletBalance(page);
expect(balance).toBeGreaterThan(0);

// BAD — calls the backend directly
const status = await page.evaluate(async () => {
  return await window.__PLAYWRIGHT_INVOKE__('get_wallet_balance');
});
```

The two sanctioned exceptions, both non-assertion paths: fixture teardown cleanup (`stopMiningDirect`) and the exchange-revert fallback when the UI genuinely has no affordance.

### Wait for conditions, not durations

The app is heavy — node sync, wallet scans, and phase restarts all take real time, and how long varies run to run. A fixed sleep is either wastefully long or flakily short. Always poll for the condition you actually need:

```typescript
// GOOD — mine until the balance visibly exceeds the target, then stop
await mineUntilBalanceExceeds(page, target);

// BAD — mine for 10 seconds and hope that was enough
await clickStartMining(page);
await page.waitForTimeout(10_000);
```

Helpers in `playwright/helpers/wait-for.ts` cover the common conditions:

```typescript
await waitForMiningReady(page, 120_000);   // start/resume button enabled
await clickStartMining(page);
await waitForMiningActive(page);           // pause button visible = mining
await clickStopMining(page);
await waitForMiningStopped(page);          // back to start/resume
await ensureBalance(page, 2);              // mine if below 2 XTM, else no-op
await waitForWalletBalance(page, 5);       // poll DOM until balance ≥ 5
```

When writing a new wait helper, follow the pattern: read from the DOM, poll with a deadline, throw with a descriptive message on timeout.

### Handling framer-motion animations

Playwright's default `click()` waits for the element to be "stable" (not animating), which can fail during opacity transitions.

1. **`dispatchEvent('click')`** — fires the click without waiting for stability. Prefer for React buttons wrapped in `AnimatePresence`.
2. **`{ force: true }`** — skips actionability checks for elements visible but mid-animation.

### Adding `data-testid` to a component

1. Add `data-testid="descriptive-name"` to the JSX element
2. Add the selector to `playwright/helpers/selectors.ts`
3. Write a wait/interaction helper in `playwright/helpers/wait-for.ts` if the interaction is non-trivial
4. Use it in your test

Keep test IDs stable. They're a public contract.

## Running tests

```bash
# First time setup
pnpm run playwright:install

# Build the binary (takes a few minutes)
cargo tauri build --debug --no-bundle --features test-mode --config src-tauri/tauri.test.conf.json

# Run tests (launches vite + backend automatically; wipes the test profile)
pnpm run playwright

# Run with pre-built binary (skip rebuild)
SKIP_BUILD=1 pnpm run playwright

# Keep chain data between runs while iterating locally
SKIP_BUILD=1 KEEP_TEST_DATA=1 pnpm run playwright

# Headed mode (see the browser)
SKIP_BUILD=1 pnpm run playwright:headed

# Playwright UI mode (interactive test runner)
SKIP_BUILD=1 pnpm run playwright:ui
```

### Pre-seeded config

Global setup wipes the test profile, then writes config files to the localnet app config dir before launching the backend:

- `config_pools.json` — pools disabled (solo mining only)
- `config_core.json` — local node, auto-update off, tor disabled
- `config_mining.json` — CPU mining enabled, GPU disabled, `mine_on_app_start: false`
- `config_wallet.json` + credential file — the known `TEST_WALLET` fixture (canonical copy in `helpers/test-wallet.ts`)

`mine_on_app_start` must be `false` so tests control when mining starts.

### Cleanup

Global teardown kills the app's whole process group (node, wallet, xmrig included) and the Vite server — including when global setup itself fails. If something still survives a hard crash:

```bash
# NB: the debug binary is "Tari Universe (Alpha)" on disk, not tari-universe
pkill -9 -f '[T]ari Universe.*--headless'
pkill -9 -f '[t]ari-universe.*--headless'
pkill -9 -f '[p]rocess-wrapper'
pkill -9 -f '[m]inotari'
pkill -9 -f '[v]ite.*vite.config.playwright'
lsof -ti:1420,9515 | xargs kill -9
```

## File layout

```
playwright/
├── playwright.config.ts      # workers: 1, retries: 0, trace/video on failure
├── package.json               # pnpm workspace package
├── tsconfig.json
├── helpers/
│   ├── fixtures.ts            # appPage fixture — fresh context per test
│   ├── global-setup.ts        # builds binary, wipes profile, seeds config, starts vite + backend
│   ├── global-teardown.ts     # process-group kill
│   ├── app-dirs.ts            # test profile identifier + data dir paths
│   ├── test-wallet.ts         # canonical TEST_WALLET fixture
│   ├── selectors.ts           # data-testid → CSS selector map
│   ├── settings.ts            # openSettingsTab / toggleAndRestore
│   ├── pin.ts                 # PIN fixtures + digit-input helpers
│   ├── mcp-client.ts          # streamable-HTTP MCP client (agent-realistic)
│   ├── state.ts               # waitForTauriReady / waitForAppReady
│   └── wait-for.ts            # condition-based UI wait helpers
├── shims/                     # Vite aliases redirect @tauri-apps/api/* here
│   ├── tauri-remote-ui-socket.ts  # WebSocket client to :9515 (auto-reconnect)
│   ├── tauri-api-core.ts          # invoke() over WebSocket
│   ├── tauri-api-event.ts         # listen() via WebSocket events
│   └── tauri-plugin-*.ts          # stubs for clipboard, dialog, os, shell
└── tests/
    ├── 01-wallet-integrity.spec.ts
    ├── 02-mining-flow.spec.ts
    ├── 03-exchange-miner.spec.ts   # describe.serial — backend mode chain
    ├── 04-send-flow.spec.ts
    ├── 05-settings.spec.ts         # General tab
    ├── 06-pause-and-schedule.spec.ts
    ├── 07-wallet-basics.spec.ts
    ├── 08-receive-and-sync.spec.ts
    ├── 09-settings-sweep.spec.ts   # wallet/mining/pools/connections/experimental/release-notes tabs
    ├── 10-mcp-server.spec.ts       # describe.serial — token flows over real HTTP
    └── 95-security-pin.spec.ts     # describe.serial — MUST run last (PIN is irreversible)
```

### Suite ordering is load-bearing

Files run alphabetically with `workers: 1`. Two constraints are encoded in
the numbering, mirroring the QA suite's hard ordering rules
(`playwright/COVERAGE.md` maps the whole QA suite to these specs):

1. **`95-security-pin.spec.ts` must stay last.** Setting the PIN is
   irreversible for the profile; every earlier spec exercises the no-PIN
   paths, then 95 verifies the PIN gates (send, seed words, sync with
   phone, MCP reveal/transaction tier). New specs must sort before it.
2. **`10-mcp-server.spec.ts` runs pre-PIN deliberately** — it proves token
   reveal/copy work ungated while no PIN exists; the PIN-gated variants
   live in 95.

`vite.config.playwright.ts` at the repo root defines the import aliases that point `@tauri-apps/api/*` to the shim files. `src-tauri/tauri-remote-ui-patched/` is the vendored WS bridge plugin.
