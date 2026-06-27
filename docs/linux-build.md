# Linux Build Guide

> **Note:** Official `.deb` and `.AppImage` release artifacts are no longer published
> as of late 2024. Linux builds work fully from source.

## Prerequisites

```bash
# Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
rustup default stable

# System libraries (Ubuntu 22.04 / Debian 12)
sudo apt-get update && sudo apt-get install -y   build-essential curl git pkg-config libssl-dev   libwebkit2gtk-4.1-dev libgtk-3-dev   libayatana-appindicator3-dev librsvg2-dev   patchelf

# Node.js v20+ and pnpm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pnpm
```

## Build

```bash
git clone https://github.com/tari-project/universe.git
cd universe
pnpm install
pnpm tauri build
```

The binary will be at `src-tauri/target/release/tari-universe`.

## Distribution

Pre-built packages are **not officially published** for Linux.
Build from source using the instructions above.
Community-maintained packages may exist but are not officially supported.

## Troubleshooting

| Error | Fix |
|-------|-----|
| `webkit2gtk not found` | Install `libwebkit2gtk-4.1-dev` |
| `appindicator not found` | Install `libayatana-appindicator3-dev` |
| Linker errors | Run `sudo apt-get install build-essential` |
