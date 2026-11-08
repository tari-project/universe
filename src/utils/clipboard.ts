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
 */

/**
 * Raised when neither the webview Clipboard API nor the Tauri plugin could
 * complete a clipboard operation. It carries both underlying failures so a
 * caller (or a log line) can tell which path failed, instead of only seeing
 * whichever error happened to surface last.
 */
export class ClipboardUnavailableError extends Error {
    readonly pluginError?: unknown;
    readonly webviewError?: unknown;

    constructor(message: string, errors?: { pluginError?: unknown; webviewError?: unknown }) {
        super(message);
        this.name = 'ClipboardUnavailableError';
        this.pluginError = errors?.pluginError;
        this.webviewError = errors?.webviewError;
    }
}

/**
 * Legacy synchronous copy through a temporary offscreen textarea.
 *
 * Returns true when the copy landed. Used as a middle fallback for writes
 * that arrive after transient user activation has expired (e.g. after an
 * async PIN prompt or IPC roundtrip): `navigator.clipboard.writeText`
 * rejects those, while the synchronous command still works from a focused
 * document. Restores the previous selection and focus so the copy leaves no
 * trace in the UI.
 */
function execCommandCopy(text: string): boolean {
    if (typeof document === 'undefined' || typeof document.execCommand !== 'function' || !document.body) {
        return false;
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
        return document.execCommand('copy');
    } catch {
        return false;
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
    // path at all under Wayland Flatpak.
    if (text.length > 0 && execCommandCopy(text)) {
        return;
    }
    try {
        await writeText(text);
    } catch (pluginError) {
        throw new ClipboardUnavailableError('Could not write to the clipboard', { pluginError, webviewError });
    }
}

export async function readClipboardText(): Promise<string> {
    try {
        return await readText();
    } catch (pluginError) {
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
}

export async function clearClipboardText(): Promise<void> {
    try {
        await clear();
    } catch (pluginError) {
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
}
