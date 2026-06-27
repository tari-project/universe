# Linux Build Documentation

## Official Release Status

As of late 2024, Tari Universe **no longer produces official `.deb` or `.AppImage` release artifacts** for Linux. Official Linux releases were discontinued due to low usage and high maintenance overhead.

## Building from Source on Linux

Linux builds still work and are fully supported via the source build path:

### Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Install system dependencies (Ubuntu/Debian)
sudo apt-get update && sudo apt-get install -y   build-essential   libssl-dev   pkg-config   libwebkit2gtk-4.1-dev   libgtk-3-dev   libayatana-appindicator3-dev   librsvg2-dev

# Install Node.js (v20+)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Build

```bash
git clone https://github.com/tari-project/universe.git
cd universe
npm install
npm run tauri build
```

The compiled binary will be at `src-tauri/target/release/tari-universe`.

### Notes

- Pre-built `.deb`/`.AppImage` packages referenced in older documentation are **no longer published**
- For production use, build from source using the instructions above
- Community-maintained packages may exist but are not officially supported
