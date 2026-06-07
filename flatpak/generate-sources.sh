#!/usr/bin/env bash
# Regenerate the offline dependency manifests for the Flatpak build.
#
# These two files let `flatpak-builder` build with no network access:
#   cargo-sources.json  - every Rust crate (incl. the tari-project git deps),
#                         vendored from ../Cargo.lock
#   node-sources.json   - every npm package, from ../package-lock.json
#
# Re-run this whenever Cargo.lock or package-lock.json changes.
#
# Requirements: python3, and network access (this step fetches sources; the
# subsequent flatpak-builder step does not).
set -euo pipefail
cd "$(dirname "$0")"

CARGO_GEN_URL="https://raw.githubusercontent.com/flatpak/flatpak-builder-tools/master/cargo/flatpak-cargo-generator.py"

# Isolated venv for the generator tooling.
if [ ! -d .venv ]; then
  python3 -m venv .venv
fi
# aiohttp+toml+tomlkit: flatpak-cargo-generator;  flatpak-node-generator: npm/yarn
./.venv/bin/pip install --quiet --upgrade pip
./.venv/bin/pip install --quiet aiohttp toml tomlkit flatpak-node-generator

# --- Rust ---
if [ ! -f flatpak-cargo-generator.py ]; then
  curl -sSL -o flatpak-cargo-generator.py "$CARGO_GEN_URL"
fi
echo "==> Generating cargo-sources.json from ../Cargo.lock"
./.venv/bin/python flatpak-cargo-generator.py ../Cargo.lock -o cargo-sources.json

# --- Node ---
echo "==> Generating node-sources.json from ../package-lock.json"
./.venv/bin/flatpak-node-generator npm ../package-lock.json -o node-sources.json

echo "==> Done. Generated:"
ls -la cargo-sources.json node-sources.json
