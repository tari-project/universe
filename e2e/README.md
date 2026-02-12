# E2E Testing — Tari Universe

## Goal

Full end-to-end testing: launch the real Tari Universe backend on LocalNet, sync the base node, mine blocks, and verify wallet balances.

## Status

**Real tests do not pass yet.** One blocking issue remains in the Tari Universe backend:

1. **Premature shutdown in `--e2e` mode.** The `SetupManager::start_setup` loop receives a shutdown signal during the `pre_setup` phase, before node/wallet/mining phases begin. The setup completes `pre_setup` (config loading, wallet init, telemetry) then immediately exits because `shutdown_signal.is_triggered()` is already true. Root cause is not yet identified — something in the pre_setup flow triggers app shutdown.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Playwright (Chromium)                  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Vite Dev Server :1420                 │  │
│  │         (App frontend + IPC shims)                │  │
│  └──────────────────────┬────────────────────────────┘  │
│                         │ WebSocket                     │
└─────────────────────────┼───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│            Tauri Binary (--e2e mode) :9515               │
│               remote-ui WebSocket                        │
│                                                         │
│  ┌─────────┐  ┌────────┐  ┌─────────┐  ┌────────────┐  │
│  │ Base    │  │ Wallet │  │ mmproxy │  │   xmrig    │  │
│  │ Node    │  │        │  │         │  │ (CPU solo) │  │
│  └─────────┘  └────────┘  └─────────┘  └────────────┘  │
│                                                         │
│                   LocalNet                              │
└─────────────────────────────────────────────────────────┘
```

## Testing Principles

### Interact via the UI, never hack the backend

E2E tests must exercise the application the way a user would: clicking buttons,
reading rendered text, and interacting with form controls. **Never add
test-specific backend commands** (e.g. `e2e_get_*`, `e2e_set_*`) to read or
write state that should be tested through the interface. The whole point of E2E
tests is to validate the full chain from UI interaction to backend behaviour.

**Allowed:**
- Click the Start Mining button to start mining
- Read block height from the rendered `[data-testid="block-height"]` element
- Open the mode dropdown and click an option to change modes
- Poll `get_base_node_status` (an existing production command) to wait for sync

**Not allowed:**
- Adding a `e2e_get_mining_config` command to read config from the backend
- Calling `invoke('start_cpu_mining')` instead of clicking the start button
- Calling `invoke('select_mining_mode')` instead of using the mode dropdown

### Always clean up mining

Every test that starts mining must stop it afterward. Use `test.afterEach` with
`stopCpuMining(page)` (the invoke-based cleanup helper) so mining never leaks
across tests. The invoke-based cleanup is acceptable because it ensures reliable
teardown even when the UI is in an unexpected state.

### Keep timeouts tight

On localnet, blocks are found in seconds. Default timeouts:
- Node sync: 30s
- Block height: 30s
- Wallet balance: 60s
- Project timeout: 90s

### Adding data-testid attributes

When you need to select a UI element in tests, add a `data-testid` attribute to
the component and register it in `helpers/selectors.ts`. Keep testids stable and
descriptive (e.g. `mining-button-start`, `block-height`, `wallet-balance`).

## How It Works

1. Binary built with `TARI_NETWORK=localnet` and `--features test-mode`
2. Global setup pre-seeds config: pools disabled (solo mining), tor disabled, local node
3. Binary launched with `--e2e` — runs full SetupManager flow AND starts remote-ui on port 9515
4. In `--e2e` mode, `FrontendReadyChannel` is pre-set so `EventsEmitter` calls don't block waiting for the webview frontend
5. Backend events are forwarded from Tauri's event system to the remote-ui WebSocket so the browser frontend receives state updates
6. In `test-mode` builds, credentials are stored in files instead of the OS keychain to avoid interactive permission dialogs
7. Vite dev server on `:1420` with shims for IPC (bridges browser JS to the remote-ui WebSocket)
8. Tests poll `get_base_node_status` via invoke and wait for real state (node sync, mining, wallet balance)

## Directory Structure

```
e2e/
├── helpers/
│   ├── global-setup.ts      # Builds binary, pre-seeds config, launches Tauri + Vite
│   ├── global-teardown.ts   # Kills all processes, cleans up ports and data
│   ├── state.ts             # waitForTauriReady()
│   ├── wait-for.ts          # UI interaction helpers and backend polling
│   └── selectors.ts         # data-testid selectors
├── shims/                    # Tauri IPC → WebSocket shims
├── tests/
│   ├── real-node.spec.ts    # Node sync and block production
│   ├── real-mining.spec.ts  # CPU solo mining
│   ├── real-wallet.spec.ts  # Wallet balance after mining
│   ├── full-flow.spec.ts    # Complete end-to-end flow
│   └── mining-modes.spec.ts # Mining mode switching and custom settings
├── playwright.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Running Tests

```bash
cd e2e
npm install
npx playwright install chromium

# First run — builds the binary (~10 min), then runs tests
npx playwright test --reporter=list

# Subsequent runs — skip build
SKIP_BUILD=1 npx playwright test --reporter=list
```

### Clean run (wipe all state)

```bash
E2E_CLEAN=1 npx playwright test --reporter=list
```

### Debug mode

```bash
SKIP_BUILD=1 npx playwright test --debug
```

## Known Limitations

- **Real tests don't pass yet** — backend shuts down prematurely in `--e2e` mode (see Status above)
- **GPU mining** — not testable (requires hardware)
- **No Tor** — disabled in E2E config

## Environment Variables

| Variable | Effect |
|---|---|
| `SKIP_BUILD` | Skip cargo build |
| `E2E_CLEAN` | Clean data directory before/after tests |
| `E2E_SKIP_BACKEND` | Skip backend startup (assumes backend is already running) |
| `TARI_UNIVERSE_BINARY` | Custom binary path |
| `TARI_NETWORK` | Network (set automatically to `localnet`) |

## Troubleshooting

- **Port conflicts:** `lsof -ti :9515 :1420 | xargs kill -9`
- **Node won't sync:** check logs in `~/Library/Logs/com.tari.universe.alpha/`
- **Binary not found:** `TARI_NETWORK=localnet cargo tauri build --debug --no-bundle --features test-mode`
- **Clean state:** run with `E2E_CLEAN=1`
- **Backend shuts down immediately:** check app-logic.log for "Shutdown signal" — this is the known blocking issue
