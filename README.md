# Tari Universe v1

[![Downloads](https://img.shields.io/badge/downloads-700k%2B-brightgreen)](https://www.tari.com/downloads/)
[![Platform Support](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)](https://www.tari.com/downloads/)

# Desktop Mining Application for Tari

Tari Universe is a desktop application that allows users to mine Tari tokens (XTM) using their Mac or PC. The application features a user-friendly interface with one-click mining setup.

## Applications

The Tari Universe ecosystem includes:

- **Tari Universe Desktop App** - Mining application for Windows, macOS, and Linux
- **Tari Universe Wallet** - Mobile companion app for tracking earnings

## Installing using binaries

### Download

[Download binaries](https://www.tari.com/downloads/) from [tari.com](https://www.tari.com/). This is the easiest way to run Tari Universe.

### Install

After downloading the binaries:

#### On Windows

Double-click the installer and follow the prompts.

#### On macOS

Open the `.dmg` file and drag Tari Universe to your Applications folder.

#### On Linux

> **Linux is community supported.** The Tari Core team does not officially support
> the Linux build, it's maintained by contributors. Hit a problem? Please
> [open an issue](https://github.com/tari-project/universe/issues), but
> preferably a PR.

The suggested way to run Tari Universe on Linux is the **Flatpak** package. One
runtime works across distros, and both CPU and GPU mining stay intact. Full build
and install steps live in [`flatpak/README.md`](flatpak/README.md).

Prefer to run the app directly? The [Building from source](#building-from-source)
steps below still work.

### Run

Launch Tari Universe from your applications menu or desktop shortcut.

## Building from source

### Install development packages

#### macOS

```bash
brew update
brew install git node cmake protobuf openssl pnpm
```

#### Ubuntu/Debian

```bash
sudo apt-get update
sudo apt-get install -y git nodejs npm build-essential \
    libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev \
    patchelf libprotobuf-dev protobuf-compiler libssl-dev \
    pkg-config cmake
```

#### Windows

Install Visual Studio Build Tools 2022 with C++ workload, then:

```powershell
# Install dependencies via chocolatey or vcpkg
choco install git nodejs protoc
```

### Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

### Install Tauri CLI

```bash
cargo install tauri-cli --locked
```

### Build

```bash
git clone https://github.com/tari-project/universe.git
cd universe
pnpm install
pnpm run tauri build
```

By default the build targets **testnet**. To build for mainnet, prefix the
command with the `TARI_TARGET_NETWORK` environment variable:

```bash
# Linux / macOS
TARI_TARGET_NETWORK=mainnet pnpm run tauri build

# Windows (PowerShell)
$env:TARI_TARGET_NETWORK="mainnet"; pnpm run tauri build
```

### Output

Packaged installers land under `target/release/bundle/`:

- **Windows**: `.msi` installer in `target/release/bundle/msi/`
- **macOS**: `.dmg` and `.app` bundle in `target/release/bundle/dmg/` and
  `target/release/bundle/macos/`

**Linux note:** the final bundling step (`.deb` / `.AppImage` / `.rpm`)
currently hangs indefinitely on most Ubuntu/Debian systems. The Rust binary
itself compiles successfully. Once the Cargo build phase completes and
bundling begins, press `Ctrl+C` - the binary is already written and fully
usable. Tauri renames the output using the `productName` from
`src-tauri/tauri.conf.json`, so the file lands at the workspace root as:

```bash
'./target/release/Tari Universe (Alpha)'
```

## Contributing

### Code Quality

The project uses comprehensive linting tools to maintain code quality:

- **Frontend**: ESLint with TypeScript, React, and Prettier integration
- **Backend**: Clippy for Rust with custom lint rules

### Running Lints

```bash
# Frontend linting
pnpm run lint          # Run all linters (knip + eslint)
pnpm run lint:fix      # Auto-fix ESLint issues
pnpm run lint:taplo    # Check TOML file formatting

# Backend linting (from src-tauri directory)
cd src-tauri
cargo clippy          # Run Rust linting
cargo fmt             # Format Rust code
```

### IDE Integration

For the best development experience, install:

- **ESLint extension** for automatic JavaScript/TypeScript linting
- **rust-analyzer extension** for Rust development
- **Prettier extension** for code formatting

Most linting issues can be auto-fixed by your IDE or the lint commands above.

## Configuration

Configuration files are stored at:

- **Linux**: `~/.config/tari-universe/`
- **Windows**: `%APPDATA%\tari-universe\`
- **macOS**: `~/Library/Application Support/tari-universe/`

## Troubleshooting

**Application won't start:**

- Check that your system meets minimum requirements
- Verify firewall isn't blocking the application
- Try running as administrator (Windows) or with appropriate permissions

**Build issues:**

- Ensure all dependencies are installed
- Check that Rust toolchain is up to date
- On Windows, use the Visual Studio Developer Command Prompt

## Getting Help

- **Community Discord**: [discord.gg/tari](https://discord.gg/tari)
- **GitHub Issues**: [github.com/tari-project/universe](https://github.com/tari-project/universe)
- **Documentation**: [docs.tari.com](https://docs.tari.com)

## Project documentation

- [RFC documents](https://rfc.tari.com) are hosted on Github Pages
- Source code documentation is hosted on [docs.rs](https://docs.rs)
- [Contributing Guide](Contributing.md)

## License

Tari Universe is open source software licensed under the [Enhanced Common Public Attribution License Version 1.0](LICENSE).
