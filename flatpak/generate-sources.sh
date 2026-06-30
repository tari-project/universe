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

# Pin the cargo generator to an exact commit (not `master`) so the script we
# fetch-and-execute can't shift under us between runs. In CI this runs in a job
# holding a release-write token, so an unpinned upstream is a supply-chain risk.
# Bump this SHA deliberately when you want a newer generator.
CARGO_GEN_REF="737c0085912f9f7dabf9341d4608e2a77a51a73a"
CARGO_GEN_URL="https://raw.githubusercontent.com/flatpak/flatpak-builder-tools/${CARGO_GEN_REF}/cargo/flatpak-cargo-generator.py"

# Isolated venv for the generator tooling.
if [ ! -d .venv ]; then
  python3 -m venv .venv
fi
# Hash-locked install (see requirements.txt): every package + transitive dep is
# pinned to an exact version and sha256, so the toolchain is reproducible and
# can't drift under the release token. --require-hashes is implied by the file.
./.venv/bin/pip install --quiet --upgrade pip
./.venv/bin/pip install --quiet --require-hashes -r requirements.txt

# --- Rust ---
# Always (re)fetch from the pinned ref and verify the content hash before
# executing it. A stale or tampered local copy is rejected rather than run.
CARGO_GEN_SHA256="b373c8ab1a05378ec5d8ed0645c7b127bcec7d2f7a1798694fbc627d570d856c"
curl -sSL -o flatpak-cargo-generator.py "$CARGO_GEN_URL"
echo "${CARGO_GEN_SHA256}  flatpak-cargo-generator.py" | sha256sum -c -
echo "==> Generating cargo-sources.json from ../Cargo.lock"
./.venv/bin/python flatpak-cargo-generator.py ../Cargo.lock -o cargo-sources.json

# --- Node ---
echo "==> Generating node-sources.json from ../package-lock.json"
./.venv/bin/flatpak-node-generator npm ../package-lock.json -o node-sources.json

echo "==> Done. Generated:"
ls -la cargo-sources.json node-sources.json
