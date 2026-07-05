# QA Suite → Playwright Coverage Map

Cross-reference between the manual QA suite
(`internal-handbook/engineering/universe/qa-test-suite.md`, v2.0) and this
Playwright e2e suite. Statuses:

- **automated** — covered by a spec in `playwright/tests/`
- **partial** — the automatable core is covered; the remainder stays manual
- **manual** — cannot be automated in this harness (reason given)

The harness drives the real Tauri backend on **localnet** with the frontend
in a browser (Tauri APIs shimmed, events bridged over the remote-ui
WebSocket). Anything that needs OS installers, real networks/exchanges,
external services (Airdrop OAuth, Metabase, pools), other devices, or OS
power events stays manual.

## §1 Install & First Run — manual

Installer/updater behaviour (exe/msi, VC++ dependency modal, manual/auto
update, seed survival across update) is packaging-level and outside the
browser harness. **Startup** itself is covered: every run boots the real
backend and `02-mining-flow` asserts the app reaches a ready miner.

## §2 Mining Core

| QA item | Status | Where |
|---|---|---|
| Start / stop / restart mining | automated | `02-mining-flow` |
| Pause 2h/8h → countdown chip, Resume immediately | automated | `06-pause-and-schedule` |
| "Pause until restart" behaves as stop | automated | used by every stop (`clickStopMining`) |
| Timed pause cleared by app restart | manual | needs a backend restart mid-suite |
| Pause on battery | manual | OS power events can't be simulated |
| Schedule: modal, save, countdown, replace, delete, pause toggle | automated | `06-pause-and-schedule` |
| Schedule: start/end edge transitions | automated (@heavy) | `06-pause-and-schedule` — waits out a real 5-min boundary |
| Schedule: persists across restart / boot-inside-window | manual | needs a backend restart |
| Modes Eco/Turbo | automated (@heavy) | `02-mining-flow` |
| Mode Ludicrous | manual | RandomX fast-mode dataset exceeds CI memory (see 02 notes) |
| Custom mode: sliders + retention | automated | `06-pause-and-schedule` (UI-level: save & re-open) |
| CPU mining tile runs/stops | automated | `02-mining-flow` (hashrate helpers) |
| GPU mining | manual | no GPU miner on macOS; needs capable Win/Linux hardware |
| Process health: miner killed → auto-restart | automated | `02-mining-flow` (xmrig kill) |
| Block time resets per block | manual | timing-sensitive; low value vs flake risk |
| Block height updates while mining, stops when stopped | automated | `02-mining-flow` + `07-wallet-basics` |
| Block height matches block explorer | manual | no explorer for localnet |
| Mining proof / telemetry in Metabase | manual | external service; telemetry disabled in test profile |
| Join Airdrop | manual | external OAuth in a real browser |

## §3 Wallet Basics

| QA item | Status | Where |
|---|---|---|
| Balance shows; survives reload | automated | `07-wallet-basics` (page reload ≈ reopen) |
| Balance updates when winning blocks | automated | `02-mining-flow` |
| Eye icon hides/shows balance | automated | `07-wallet-basics` |
| History defaults to All activity; filters Rewards/Transactions | automated | `07-wallet-basics` (+ Transactions filter in `04-send-flow`) |
| Rewards widget: open, totals, hide | automated | `07-wallet-basics` |
| Rewards hover: Flex & Invite / playback animation | manual | hover-only framer-motion controls are unreliable headless; playback is visual |

## §4 Send & Receive (no PIN)

| QA item | Status | Where |
|---|---|---|
| Send: validation, review, broadcast, history, details, copy raw, completion | automated | `04-send-flow` |
| Block-height link opens explorer | manual | no explorer for localnet |
| Receive: modal, QR, Base58⇄emoji toggle, copy address | automated | `08-receive-and-sync` |
| Receive funds via QR scan from another device | manual | needs a second device; self-send in `04` proves receipt |

## §5 Security PIN — automated, runs LAST

`95-security-pin.spec.ts`. The PIN is irreversible per profile, and the
whole profile is wiped at the start of every run — so the suite mirrors the
handbook's hard ordering rule: **all no-PIN specs run first, the PIN spec
runs last** (file naming keeps it last; `workers: 1`, no shuffle).

| QA item | Status |
|---|---|
| PIN setup: create, wrong confirm error, re-create, success | automated |
| Send gated by PIN (wrong PIN error → correct PIN proceeds) | automated |
| Seed words reveal gated by PIN | automated |
| Monero seed words gated by PIN | partial — same gate component; covered via seed words |
| Sync with Phone gated by PIN | automated |

## §6 Settings Sweep

| Tab | Status | Where |
|---|---|---|
| General (toggles, language, theme, visual mode, app info, reset dialog) | automated | `05-settings` |
| General: auto-start actually starts on boot; reset actually deletes dirs | manual | machine-level side effects |
| Airdrop | manual | external service |
| Wallet: addresses shown + copyable, seed words hidden→reveal, Monero address | automated | `01-wallet-integrity` + `09-settings-sweep` |
| Wallet: Refresh wallet history rescan | manual | long rescan, destructive to suite timing |
| Mining: CPU/GPU/mine-on-startup/battery toggles | automated | `09-settings-sweep` |
| Mining on startup honoured across restart | manual | needs backend restart |
| Mining Pools: sections, per-pool stats/config UI, toggles | partial | `09-settings-sweep` asserts UI; real pool connections are external, never enabled in tests |
| Connections: node config, network, peers list | automated | `09-settings-sweep` (display; switching node type is disruptive → manual) |
| MCP server: enable, token redacted, port status | automated | `10-mcp-server` |
| MCP server: reveal/copy token (PIN), tier toggles, agent HTTP calls, approval dialog | automated | `95-security-pin` (needs the PIN) + `10-mcp-server` |
| Experimental: master toggle reveals Debug/Versions/Tor sections | automated | `09-settings-sweep` |
| Experimental: Tor actually off/on across network | manual | Tor disabled in test profile; network-level verification |
| Release Notes: renders, latest expanded, collapse/expand | automated | `09-settings-sweep` (tolerates offline fetch failure) |

## §7 Peripheral

| QA item | Status | Where |
|---|---|---|
| Exchange miner: switch, hidden balance, swap back, mining after | automated | `03-exchange-miner` |
| Swaps UI (never execute) | manual | quote/wallet-connect services don't exist on localnet |
| Bridging | manual | needs mainnet funds + MetaMask |
| Sync with Phone (desktop side: QR + identification code) | automated | `08-receive-and-sync` |
| Wallet Connect / Aurora | manual | needs mobile device |

## §8 Wallet Import — manual (for now)

Import needs a *second* valid localnet wallet's seed words. The app offers
no "create wallet" path that hands back seed words without replacing the
active wallet, so a static second test wallet must be generated and checked
in (same process that produced `helpers/test-wallet.ts`). Tracked as a
follow-up; until then import stays in the manual run.

## §9 Shutdown — partial

Global teardown SIGTERMs the app and would surface hung children as a
timeout, but there is no explicit assertion that every sidecar exited.
The manual check (Activity Monitor sweep) stays.
