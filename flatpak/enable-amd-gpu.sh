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

  # We cannot just bind $ICD_DIR: the usual location (/etc/OpenCL/vendors) is
  # under /etc, which flatpak refuses to share ("Path /etc is reserved"), so the
  # ICD would never reach the sandbox. And ROCm's libamdocl64.so pulls in host
  # libraries the GNOME runtime doesn't ship (e.g. libnuma.so.1), so even a
  # reachable ICD fails to load. So stage the ICD(s) + those extra host libs
  # into a plain dir the sandbox CAN mount, and point the loader there. The .icd
  # names libamdocl64.so relatively; it resolves from $ROCM_PATH/lib via
  # LD_LIBRARY_PATH below.
  STAGE="${XDG_DATA_HOME:-$HOME/.local/share}/tari-universe/rocm-shim"
  mkdir -p "$STAGE"
  cp -f "$ICD_DIR"/*.icd "$STAGE"/
  # Host libs libamdocl64.so needs that aren't in the runtime. If ldd shows more
  # "not found" against $ROCM_PATH/lib/libamdocl64.so on your system, add them here.
  for lib in libnuma.so.1; do
    p=""
    for d in /usr/lib/x86_64-linux-gnu /usr/lib64 /usr/lib /lib/x86_64-linux-gnu; do
      if [ -e "$d/$lib" ]; then p="$d/$lib"; break; fi
    done
    if [ -n "$p" ]; then cp -Lf "$p" "$STAGE"/; else
      echo "WARN: $lib not found on host; ROCm OpenCL may fail to load." >&2
    fi
  done

  # LD_LIBRARY_PATH is heavy-handed (it applies to the whole app), but ROCm's
  # libamdocl64.so needs its sibling libs on the path. Adjust if it shadows a
  # runtime lib.
  set -x
  flatpak override --user "$APP" \
    --filesystem="${ROCM_PATH}:ro" \
    --filesystem="${STAGE}:ro" \
    --env=OCL_ICD_VENDORS="${STAGE}" \
    --env=LD_LIBRARY_PATH="${ROCM_PATH}/lib:${STAGE}"
  set +x
  echo
  echo "Exposed host ROCm ($ROCM_PATH) + staged ICD/libs ($STAGE) to $APP."
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
