# Tari Universe — Flatpak packaging

A proper, offline `flatpak-builder` package for Tari Universe that **retains CPU
and GPU mining**. This exists because upstream dropped the `.deb`/`.AppImage`
Linux artifacts — not because the app can't run on Linux (all Linux mining code
paths are intact), but because per-distro packaging "spread efforts too thin"
(see the comment in `.github/workflows/release.yml`). A single Flatpak runtime is
exactly the fix for that fragmentation.

## How it works

Tari Universe downloads its sidecars — `xmrig` (CPU/RandomX), `lolMiner` (GPU),
`minotari_node`, `minotari_console_wallet`, `mmproxy`, `sha-p2pool`, `tor` — at
runtime into its per-app cache and executes them. Flatpak does **not** mount the
per-app data/cache `noexec`, so this download-and-run model works inside the
sandbox. The `finish-args` in the manifest grant exactly what those sidecars
need (network, GPU device nodes, secret storage, tray).

## Files

| File | Purpose |
|------|---------|
| `com.tari.universe.yml` | The Flatpak manifest |
| `com.tari.universe.desktop` | Desktop entry |
| `com.tari.universe.metainfo.xml` | AppStream metadata |
| `patches/0001-*.patch` | Disables the bundled self-updater + crate autostart under Flatpak |
| `generate-sources.sh` | (Re)generates the offline dependency manifests |
| `cargo-sources.json` | Vendored Rust crates (generated) |
| `node-sources.json` | Vendored npm packages (generated) |

## Build

```bash
# 1. One-time: install the runtime, SDK and SDK extensions
flatpak install -y flathub \
  org.gnome.Platform//50 org.gnome.Sdk//50 \
  org.freedesktop.Sdk.Extension.rust-stable//25.08 \
  org.freedesktop.Sdk.Extension.node22//25.08

# 2. (Re)generate the offline source manifests — needs network
./generate-sources.sh

# 3. Build + install (no network used here)
flatpak-builder --user --install --force-clean build-dir com.tari.universe.yml

# 4. Run
flatpak run com.tari.universe
```

> The manifest's app source is `type: dir` pointing at this repo, so it builds
> **whatever is checked out** — no commit/version pinning. The vendored offline
> sources (`cargo-sources.json` / `node-sources.json`) must match the checked-out
> tree's lockfiles; run `./generate-sources.sh` after any `Cargo.lock` /
> `package-lock.json` change (CI does this automatically — see below).

## CI / future releases

`.github/workflows/flatpak.yml` builds the bundle and, on a published release,
attaches `tari-universe-<version>-x86_64.flatpak` as a release asset. It's
**self-maintaining**: it regenerates the offline sources from the release's own
lockfiles each run, and the manifest builds the checked-out commit — so new
releases need no manual updates here. It's standalone and doesn't touch the
existing `release.yml`. Trigger it manually via *Actions → Flatpak → Run workflow*.

## Mining capability notes

- **CPU (xmrig / RandomX):** works. Peak hashrate optimisations that need root —
  MSR register tweaks (`/dev/cpu/*/msr`) and 1 GB huge pages — are not available
  in the sandbox, so expect standard (non-MSR) hashrate. This matches what any
  non-root Linux miner gets.
- **GPU NVIDIA (lolMiner):** works. The runtime auto-pulls the matching
  `org.freedesktop.Platform.GL.nvidia-<driver>` extension, which provides
  CUDA/OpenCL/NVML. `--device=all` exposes `/dev/nvidia*`.
- **GPU AMD (lolMiner):** the weakest link. Needs OpenCL via Mesa Rusticl (in the
  runtime GL extension) or a ROCm stack; `--device=all` exposes `/dev/kfd` and
  `/dev/dri`. Test on your specific card before relying on it.

## What the patch changes

`patches/0001-disable-updater-and-autostart-under-flatpak.patch` adds a
`FLATPAK_ID` guard to two functions so that, when running as a Flatpak:

- `UpdatesManager::try_update` no-ops — the app lives on read-only `/app` and is
  updated via `flatpak update`, so the bundled Tauri updater can never succeed.
- `AutoLauncher::initialize_auto_launcher` no-ops — `current_exe()` points at
  `/app/bin` which the host cannot launch directly; autostart should instead go
  through the Background portal (already permitted in `finish-args`).

The guards are inert in non-Flatpak builds, so the patch is safe to keep.

## App ID / network

The manifest builds the **mainnet** variant (`--features release-ci`,
`TARI_NETWORK=mainnet`), which sets the app data folder id to `com.tari.universe`
— matching the Flatpak app-id. For a testnet build, drop `--features release-ci`
(folder id becomes `com.tari.universe.alpha`) and set `TARI_NETWORK=esmeralda`;
rename the manifest/app-id to match if you want the sandbox path to line up.
