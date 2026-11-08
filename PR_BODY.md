fix(clipboard): write through the webview so copy works in the Flatpak under Wayland

Fixes #3489

## Problem

In the Linux Flatpak under a Wayland session every copy button silently did
nothing. The manifest grants `--socket=wayland` with `--socket=fallback-x11`, so
the sandbox gets no `DISPLAY`; `arboard`'s Wayland backend needs the privileged
data-control protocol, which the compositor withholds from sandboxed clients, so
the plugin falls back to X11 and times out. Every call site swallowed that error,
so users — including on the seed-words screen — believed the copy had worked.

## Fix

All clipboard access now goes through one shared module,
`src/utils/clipboard.ts`, which prefers the webview's own clipboard API and falls
back to the Tauri plugin:

- **Write** (`writeToClipboard`) tries `navigator.clipboard.writeText` first.
  WebKitGTK writes through the GTK clipboard, which the compositor does serve, so
  this is the path that works in the Flatpak under Wayland — and it does not
  widen the sandbox. The plugin stays as the fallback for contexts without a
  webview clipboard, so Windows, macOS, the .deb/AppImage and
  Flatpak-under-X11 are unchanged.
- **Read** (`readFromClipboard`) mirrors that order and resolves to `undefined`
  instead of throwing, so `ClipboardViewer`'s 1-second poll survives a failing
  read rather than taking the effect down with it.
- **Clear** (`clearClipboard`) wipes through the webview by writing an empty
  string, falling back to the plugin's `clear()`.

Call sites converted to the shared path:

- `useCopyToClipboard` — the hook now surfaces a failure as a toast instead of
  only `console.error`, which matters most for the seed phrase.
- `AgentConfig.tsx` and `TokenDisplay.tsx` — the direct `writeText` imports named
  in the issue now route through `useCopyToClipboard`.
- `ShareRewardModal.tsx` — had no `.catch()` at all, so a failed referral-link
  copy was invisible.
- `ProcessingTransaction.tsx` — was the one call site using
  `navigator.clipboard.writeText` directly, with no error handling; it also set
  the "copied" tick before the write resolved, so the tick could lie.
- `ClipboardViewer.tsx` — the read path flagged in the issue as "worth checking";
  it had the same X11 timeout on every poll.

## Verification

- `pnpm test`: 80 files, 1387 tests pass (1369 before, +18 new). No regressions.
- `tsc --noEmit`, `eslint`, `prettier --check`, `knip`: clean.
- Functional PoC against the real module in a real browser engine (Chrome via
  Playwright), with the Flatpak/Wayland condition reproduced by making the
  webview clipboard reject:
  1. webview write succeeds and the value round-trips — `clipboard =
     "tari1proof_webview_path_ok"`;
  2. with the webview denied, `writeToClipboard` rejects with a single typed
     `ClipboardUnavailableError` carrying both underlying errors, rather than
     being swallowed;
  3. `readFromClipboard` resolves to `undefined` instead of throwing.
  Screenshot: `clipboard-evidence.png`.

## Not verified here

The issue asks for proof from a real Flatpak build under Wayland on at least two
desktops. This host has no Flatpak toolchain, no WebKitGTK, no Wayland compositor
and no `wl-clipboard`, so that proof could not be produced here — the acceptance
criterion is unmet and the maintainer will need to run it. The functional proof
above covers the code path, not the packaged sandbox.

Yzgaming005
