# E2E Testing — Tari Universe

## Goal

The goal is **full end-to-end testing**: launch the real Tari Universe backend on LocalNet, sync the base node, mine blocks, and verify wallet balances. The mock tests exist as scaffolding but are low priority — real backend tests are what matter.

## Status

**Real tests (`--project=real`) do not pass yet.** Two blocking issues remain in the Tari Universe backend:

1. **Premature shutdown in `--e2e` mode.** The `SetupManager::start_setup` loop receives a shutdown signal during the `pre_setup` phase, before node/wallet/mining phases begin. The setup completes `pre_setup` (config loading, wallet init, telemetry) then immediately exits because `shutdown_signal.is_triggered()` is already true. Root cause is not yet identified — something in the pre_setup flow triggers app shutdown.

Mock tests (`--project=mock`) pass.

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

## How It Works

1. Binary built with `TARI_NETWORK=localnet` and `--features test-mode`
2. Global setup pre-seeds config: pools disabled (solo mining), tor disabled, local node
3. Binary launched with `--e2e` — runs full SetupManager flow AND starts remote-ui on port 9515
4. In `--e2e` mode, `FrontendReadyChannel` is pre-set so `EventsEmitter` calls don't block waiting for the webview frontend
5. Vite dev server on `:1420` with shims for IPC (bridges browser JS to the remote-ui WebSocket)
6. Real tests poll `get_base_node_status` via invoke and wait for real state (node sync, mining, wallet balance)

## Directory Structure

```
e2e/
├── helpers/
│   ├── global-setup.ts      # Builds binary, pre-seeds config, launches Tauri + Vite
│   ├── global-teardown.ts   # Kills all processes, cleans up ports and data
│   ├── state.ts             # waitForTauriReady(), setState.*, invoke()
│   ├── wait-for.ts          # Real backend polling: waitForNodeSynced, startCpuMining, etc.
│   ├── fixtures.ts          # Predefined mock state objects
│   └── selectors.ts         # data-testid selectors
├── shims/                    # Tauri IPC → WebSocket shims
├── tests/
│   ├── real-node.spec.ts    # Real: node sync and block production
│   ├── real-mining.spec.ts  # Real: CPU solo mining
│   ├── real-wallet.spec.ts  # Real: wallet balance after mining
│   ├── full-flow.spec.ts    # Real: complete end-to-end flow
│   ├── app-launch.spec.ts   # Mock: basic app launch (low priority)
│   ├── mining.spec.ts       # Mock: mining state injection (low priority)
│   ├── wallet.spec.ts       # Mock: wallet state injection (low priority)
│   └── error-handling.spec.ts # Mock: error states (low priority)
├── playwright.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Running Tests

### Real backend tests (the goal)

```bash
cd e2e
npm install
npx playwright install chromium

# First run — builds the binary (~10 min), then runs tests
npx playwright test --project=real --reporter=list

# Subsequent runs — skip build
SKIP_BUILD=1 npx playwright test --project=real --reporter=list
```

### All tests

```bash
SKIP_BUILD=1 npx playwright test --reporter=list
```

### Clean run (wipe all state)

```bash
E2E_CLEAN=1 npx playwright test --reporter=list
```

### Debug mode

```bash
SKIP_BUILD=1 npx playwright test --project=real --debug
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
| `E2E_MODE` | Set to `mock` for mock-only backend mode |
| `TARI_UNIVERSE_BINARY` | Custom binary path |
| `TARI_NETWORK` | Network (set automatically to `localnet`) |

## Troubleshooting

- **Port conflicts:** `lsof -ti :9515 :1420 | xargs kill -9`
- **Node won't sync:** check logs in `~/Library/Logs/com.tari.universe.alpha/`
- **Binary not found:** `TARI_NETWORK=localnet cargo tauri build --debug --no-bundle --features test-mode`
- **Clean state:** run with `E2E_CLEAN=1`
- **Backend shuts down immediately:** check app-logic.log for "Shutdown signal" — this is the known blocking issue
