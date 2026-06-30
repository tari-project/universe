#!/usr/bin/env bash
# Experimental: enable AMD GPU mining for the installed Tari Universe Flatpak.
#
# Nothing is bundled. The GNOME runtime ships only Mesa Rusticl OpenCL, which
# lolMiner does not enumerate, so AMD GPU mining is off by default (see README,
# "AMD GPU mining"). This script grants the sandbox access to a GPU compute
# OpenCL runtime via `flatpak override`, in one of two ways:
#
#   A) host passthrough (default) — expose your HOST ROCm install + its OpenCL
#      ICD into the sandbox and point the ICD loader at them. Works today with
#      whatever ROCm you already run on the host.
#
#   B) GL.ROCm extension (--ext) — if you have an org.freedesktop.Platform.GL.ROCm
#      runtime extension installed, just select it with FLATPAK_GL_DRIVERS. The
#      runtime's inherited GL extension point then auto-merges its ICD + libs
#      (no host paths exposed). No such extension is published on Flathub today,
#      so this is the forward path for when one exists.
#
# Prerequisites (host side, NOT done here):
#   * A working host ROCm OpenCL stack for your card — confirm `clinfo` /
#     `rocminfo` show the GPU on the HOST before running this.
#   * Your user in the `render` and `video` groups.
#
# Caveats: unsupported and ABI-fragile. Host ROCm libraries must load against
# the GNOME 50 runtime's glibc; if your host glibc is newer they may not load.
# RDNA4 / gfx1201 ROCm support is still very raw. If GPU mining doesn't light
# up, fall back to CPU mining.
set -euo pipefail

APP=com.tari.universe
MODE=host
[ "${1:-}" = "--ext" ] && MODE=ext

if [ "$MODE" = "ext" ]; then
  # B) Select an installed GL.ROCm extension. --device=all (granted by the
  # manifest) already exposes /dev/kfd + /dev/dri.
  if ! flatpak info "org.freedesktop.Platform.GL.ROCm" >/dev/null 2>&1; then
    echo "ERROR: org.freedesktop.Platform.GL.ROCm is not installed." >&2
    echo "       Install a matching (25.08) GL.ROCm extension first." >&2
    exit 1
  fi
  set -x
  flatpak override --user "$APP" --env=FLATPAK_GL_DRIVERS=ROCm:default
  set +x
  echo
  echo "Selected the GL.ROCm extension for $APP."
else
  # A) Host passthrough.
  ROCM_PATH="${ROCM_PATH:-/opt/rocm}"
  ICD_DIR="${ICD_DIR:-/etc/OpenCL/vendors}"

  if [ ! -d "$ROCM_PATH" ]; then
    echo "ERROR: $ROCM_PATH not found. Install ROCm on the host, or set ROCM_PATH=." >&2
    exit 1
  fi
  if ! ls "$ICD_DIR"/*.icd >/dev/null 2>&1; then
    echo "ERROR: no OpenCL ICD (*.icd) in $ICD_DIR. Set ICD_DIR= to your vendor dir." >&2
    exit 1
  fi

  # LD_LIBRARY_PATH is heavy-handed (it applies to the whole app), but ROCm's
  # libamdocl64.so usually needs its sibling libs on the path. Adjust if it
  # shadows a runtime lib.
  set -x
  flatpak override --user "$APP" \
    --filesystem="${ROCM_PATH}:ro" \
    --filesystem="${ICD_DIR}:ro" \
    --env=OCL_ICD_VENDORS="${ICD_DIR}" \
    --env=LD_LIBRARY_PATH="${ROCM_PATH}/lib"
  set +x
  echo
  echo "Exposed host ROCm ($ROCM_PATH) + ICD ($ICD_DIR) to $APP."
fi

echo "(--device=all, needed for /dev/kfd + /dev/dri, is already granted by the manifest.)"
echo
echo "If your GPU is an unsupported gfx target, you may also need:"
echo "  flatpak override --user $APP --env=HSA_OVERRIDE_GFX_VERSION=<x.y.z>"
echo
echo "Relaunch and check lolMiner's startup log for"
echo "  'Number of OpenCL supported GPUs: N'  (N > 0 means it worked)."
echo "Undo everything (resets ALL overrides for the app):"
echo "  flatpak override --user --reset $APP"
