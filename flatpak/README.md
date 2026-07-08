# Tari Universe — Flatpak packaging

> **Community supported.** Linux and this Flatpak are maintained by contributors,
> not officially supported by the Tari team. Found a bug? Open an issue, but
> preferably a PR.

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
| `requirements.txt` | Hash-locked pins for the generator toolchain (used by `generate-sources.sh`) |
| `enable-amd-gpu.sh` | Opt-in helper to expose a host AMD OpenCL/ROCm stack to the installed app (experimental) |
| `cargo-sources.json` | Vendored Rust crates (generated) |
| `node-sources.json` | Vendored npm packages, from pnpm-lock.yaml (generated) |

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
> `pnpm-lock.yaml` change (CI does this automatically — see below).

## CI / future releases

`.github/workflows/flatpak.yml` builds the bundle and, on a published release,
attaches `tari-universe-<version>-x86_64.flatpak` as a release asset. It's
**self-maintaining**: it regenerates the offline sources from the release's own
lockfiles each run, and the manifest builds the checked-out commit — so new
releases need no manual updates here. It's standalone and doesn't touch the
existing `release.yml`. Trigger it manually via *Actions → Flatpak → Run workflow*.

Before building, CI strips the `(Alpha)` branding / `.alpha` identifier with the
**same `yq` rewrite `release.yml` uses for its RELEASE builds** (one source of
truth for the production naming), and writes the AppStream `<release>` version +
date from `tauri.conf.json` / the release date. None of that is checked in, so a
**local** `flatpak-builder` build keeps the Alpha branding — that's the intended
local default. To produce a production-identical build locally, apply the same
`yq`/`sed` rewrites from the *Set production identity* step before building.

## Mining capability notes

- **CPU (xmrig / RandomX):** works. Peak hashrate optimisations that need root —
  MSR register tweaks (`/dev/cpu/*/msr`) and 1 GB huge pages — are not available
  in the sandbox, so expect standard (non-MSR) hashrate. This matches what any
  non-root Linux miner gets.
- **GPU NVIDIA (lolMiner):** works. The runtime auto-pulls the matching
  `org.freedesktop.Platform.GL.nvidia-<driver>` extension, which provides a real
  CUDA/OpenCL/NVML stack. `--device=all` exposes `/dev/nvidia*`.
- **GPU AMD (lolMiner): off by default; experimental opt-in below.**
  `--device=all` exposes `/dev/kfd` + `/dev/dri` correctly, but the GNOME
  runtime's GL extension ships only Mesa **Rusticl** OpenCL, which lolMiner does
  not enumerate (it reports 0 OpenCL GPUs). lolMiner's AMD path needs a real
  vendor compute runtime (ROCm / amdgpu-pro). We do **not bundle** one (it would
  be multi-GB, and there is no Flathub ROCm GL extension to pull in —
  freedesktop-sdk [issue #1181](https://gitlab.com/freedesktop-sdk/freedesktop-sdk/-/issues/1181)
  is still open). You can instead expose a working **host** ROCm stack to the
  sandbox; see below.

### AMD GPU mining (experimental, host-provided ROCm)

The default sandbox is unchanged — this is a per-machine, user-applied opt-in
that grants the installed app access to *your host's* AMD OpenCL stack. Nothing
is bundled and nobody else's install is affected.

> **Unsupported and ABI-fragile.** The host ROCm libraries must load against the
> GNOME 50 runtime's glibc; if your host glibc is newer they may fail to load.
> RDNA4 / `gfx1201` ROCm support is still very raw across the ecosystem. Treat
> this as "try it on your card", not a guarantee. If it doesn't light up, use
> CPU mining.

Why it can work at all: the runtime's OpenCL **ICD loader** already functions
(it loads Rusticl and reports 0 devices) — the only missing piece is a *working
AMD ICD*. Exposing one is enough; lolMiner auto-detects it. No app change needed.

**Prerequisites (host side):** a working host ROCm OpenCL install for your card
(confirm `clinfo` / `rocminfo` see the GPU on the host), and your user in the
`render` + `video` groups.

**Two paths**, both via the helper `./enable-amd-gpu.sh`:

- **(A) Host passthrough** (default, usable today) — exposes `/opt/rocm` + the
  host OpenCL ICD read-only and sets `OCL_ICD_VENDORS` / `LD_LIBRARY_PATH`:

  ```bash
  ./enable-amd-gpu.sh            # or: ROCM_PATH=/opt/rocm ICD_DIR=/etc/OpenCL/vendors ./enable-amd-gpu.sh
  ```

  Equivalent manual override:
  ```bash
  flatpak override --user com.tari.universe \
    --filesystem=/opt/rocm:ro --filesystem=/etc/OpenCL:ro \
    --env=OCL_ICD_VENDORS=/etc/OpenCL/vendors \
    --env=LD_LIBRARY_PATH=/opt/rocm/lib
  ```

- **(B) GL.ROCm extension** (forward path) — if an
  `org.freedesktop.Platform.GL.ROCm` runtime extension matching the base
  (`25.08`) is ever installed, the runtime's inherited
  `org.freedesktop.Platform.GL` extension point auto-merges its OpenCL ICD and
  puts its libs on the loader path (its `merge-dirs` already includes
  `OpenCL/vendors`). No manifest change is needed — just select it:

  ```bash
  ./enable-amd-gpu.sh --ext     # sets FLATPAK_GL_DRIVERS=ROCm:default
  ```

  No such extension is published on Flathub today, so (A) is the realistic path
  for now.

For an unsupported gfx target you may also need
`--env=HSA_OVERRIDE_GFX_VERSION=<x.y.z>`. Verify with lolMiner's startup line
`Number of OpenCL supported GPUs: N`. Undo with
`flatpak override --user --reset com.tari.universe`.

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
