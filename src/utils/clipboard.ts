import { invoke } from '@tauri-apps/api/core';
import { clear, readText, writeText } from '@tauri-apps/plugin-clipboard-manager';

/**
 * Shared clipboard access for the whole app.
 *
 * The Tauri clipboard plugin (arboard) cannot write inside the Linux Flatpak under a
 * Wayland session: the manifest grants `--socket=wayland` + `--socket=fallback-x11`, so
 * the sandbox has no `DISPLAY`, and the compositor withholds the privileged
 * data-control protocol arboard's Wayland path needs, so it falls back to X11 and
 * fails with "X11 server connection timed out because it was unreachable".
 *
 * The webview's own Clipboard API goes through WebKitGTK's GTK clipboard, which works
 * for ordinary Wayland clients without data-control — and it widens nothing in the
 * sandbox. Writes therefore try the webview first and fall back to the plugin where
 * the API is missing or refuses (e.g. no user activation). Reads keep the plugin
 * first: the timed read-back that verifies a secret before clearing it runs outside
 * a user gesture, where the webview read is usually denied, while the plugin read is
 * the path that already works on every platform that supports it today.
 *
 * Inside a Flatpak sandbox on Wayland with no X11 display at all, the plugin has
 * no path that could ever work — calling it only hangs on the X11 timeout — so
 * the `clipboard_needs_webview` command detects that sandbox once and every
 * operation skips the plugin there, failing fast with the webview error.
 * Outside the sandbox the order above is unchanged.
 */

/**
 * Raised when neither the webview Clipboard API, the legacy execCommand copy
 * nor the Tauri plugin could complete a clipboard operation. It carries every
 * underlying failure so a caller (or a log line) can tell which path failed,
 * instead of only seeing whichever error happened to surface last.
 */
export class ClipboardUnavailableError extends Error {
    readonly pluginError?: unknown;
    readonly webviewError?: unknown;
    readonly execCommandError?: unknown;

    constructor(
        message: string,
        errors?: { pluginError?: unknown; webviewError?: unknown; execCommandError?: unknown }
    ) {
        super(message);
        this.name = 'ClipboardUnavailableError';
        this.pluginError = errors?.pluginError;
        this.webviewError = errors?.webviewError;
        this.execCommandError = errors?.execCommandError;
    }
}

/**
 * Legacy synchronous copy through a temporary offscreen textarea.
 *
 * Returns null when the copy landed, otherwise the reason it did not, so the
 * caller can report why this fallback failed instead of dropping the cause.
 * Used as a middle fallback for writes that arrive after transient user
 * activation has expired (e.g. after an async PIN prompt or IPC roundtrip):
 * `navigator.clipboard.writeText` rejects those, while the synchronous
 * command still works from a focused document. Restores the previous
 * selection and focus so the copy leaves no trace in the UI.
 */
function execCommandCopy(text: string): string | null {
    if (typeof document === 'undefined' || typeof document.execCommand !== 'function' || !document.body) {
        return 'document.execCommand is unavailable';
    }
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-9999px';
    area.style.opacity = '0';
    const selection = typeof window !== 'undefined' ? window.getSelection?.() : null;
    const savedRanges: Range[] = [];
    if (selection) {
        for (let i = 0; i < selection.rangeCount; i += 1) {
            savedRanges.push(selection.getRangeAt(i).cloneRange());
        }
    }
    const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.appendChild(area);
    try {
        area.focus({ preventScroll: true });
        area.select();
        if (!document.execCommand('copy')) {
            return 'document.execCommand("copy") returned false';
        }
        return null;
    } catch (e) {
        return e instanceof Error ? e.message : String(e);
    } finally {
        document.body.removeChild(area);
        if (selection) {
            selection.removeAllRanges();
            for (const range of savedRanges) {
                selection.addRange(range);
            }
        }
        activeElement?.focus?.({ preventScroll: true });
    }
}

function webviewClipboard(): Clipboard | undefined {
    if (typeof navigator === 'undefined') return undefined;
    return navigator.clipboard;
}

/**
 * Whether the app runs in a Flatpak sandbox on Wayland with no X11 display,
 * where the native plugin can never work (see the module comment). Detected
 * once through the backend and cached for the lifetime of the module; when
 * the backend cannot be reached the answer is false, which keeps the
 * current behaviour everywhere else. The answer is only trusted when it is
 * exactly `true`: anything else (a stale backend, a test double returning a
 * placeholder) must not silently switch the app to webview-only clipboard.
 */
let webviewOnlyClipboard: Promise<boolean> | null = null;

function needsWebviewOnlyClipboard(): Promise<boolean> {
    if (!webviewOnlyClipboard) {
        try {
            webviewOnlyClipboard = invoke<boolean>('clipboard_needs_webview')
                .then((value) => value === true)
                .catch(() => false);
        } catch {
            webviewOnlyClipboard = Promise.resolve(false);
        }
    }
    return webviewOnlyClipboard;
}

export async function writeClipboardText(text: string): Promise<void> {
    const webview = webviewClipboard();
    let webviewError: unknown;
    if (webview?.writeText) {
        try {
            await webview.writeText(text);
            return;
        } catch (e) {
            // Fall through to the plugin: the webview refused (permissions, focus,
            // unsupported webview), but the native path may still work. Keep the
            // webview failure so the typed error below can report both causes.
            webviewError = e;
        }
    }
    // The async Clipboard API needs transient user activation, which may have
    // expired by the time an async step (PIN prompt, IPC roundtrip) finishes.
    // Try the synchronous legacy copy before the native plugin, which has no
    // path at all under Wayland Flatpak. Keep its failure reason: when every
    // path fails, the typed error below reports all three causes.
    let execCommandError: unknown;
    if (text.length > 0) {
        execCommandError = execCommandCopy(text);
        if (!execCommandError) {
            return;
        }
    }
    if (await needsWebviewOnlyClipboard()) {
        // Inside the Flatpak/Wayland sandbox the plugin would only fall back
        // to an X11 server that does not exist and hang on its timeout, so
        // fail fast with the webview failures instead of calling it.
        throw new ClipboardUnavailableError('Could not write to the clipboard', {
            webviewError,
            execCommandError,
        });
    }
    try {
        await writeText(text);
    } catch (pluginError) {
        throw new ClipboardUnavailableError('Could not write to the clipboard', {
            pluginError,
            webviewError,
            execCommandError,
        });
    }
}

export async function readClipboardText(): Promise<string> {
    let pluginError: unknown;
    if (!(await needsWebviewOnlyClipboard())) {
        try {
            return await readText();
        } catch (e) {
            pluginError = e;
        }
    }
    const webview = webviewClipboard();
    if (webview?.readText) {
        try {
            return await webview.readText();
        } catch (webviewError) {
            throw new ClipboardUnavailableError('Could not read from the clipboard', {
                pluginError,
                webviewError,
            });
        }
    }
    throw new ClipboardUnavailableError('Could not read from the clipboard', { pluginError });
}

export async function clearClipboardText(): Promise<void> {
    let pluginError: unknown;
    if (!(await needsWebviewOnlyClipboard())) {
        try {
            await clear();
            return;
        } catch (e) {
            pluginError = e;
        }
    }
    const webview = webviewClipboard();
    if (webview?.writeText) {
        try {
            await webview.writeText('');
            return;
        } catch (webviewError) {
            throw new ClipboardUnavailableError('Could not clear the clipboard', {
                pluginError,
                webviewError,
            });
        }
    }
    throw new ClipboardUnavailableError('Could not clear the clipboard', { pluginError });
}
