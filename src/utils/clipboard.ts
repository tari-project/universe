import { clear, readText, writeText } from '@tauri-apps/plugin-clipboard-manager';

/**
 * Raised when neither the webview nor the Tauri plugin could write the clipboard.
 *
 * `detail` carries the underlying errors so callers can log them without this
 * module having to decide how they are surfaced.
 */
export class ClipboardUnavailableError extends Error {
    constructor(readonly detail?: unknown) {
        super('Could not write to the clipboard');
        this.name = 'ClipboardUnavailableError';
    }
}

/**
 * True when the webview exposes an async clipboard API.
 *
 * `navigator.clipboard` is only present in secure contexts, and inside a Tauri
 * webview the origin is a `tauri://` / `https://tauri.localhost` URL that
 * qualifies. Older WebKitGTK builds and plain `http://` dev servers do not, so
 * the check is a capability probe rather than an environment test.
 */
const hasWebviewClipboard = (method: 'writeText' | 'readText'): boolean =>
    typeof navigator !== 'undefined' && typeof navigator.clipboard?.[method] === 'function';

/**
 * Writes through the webview's own clipboard API.
 *
 * In the Linux Flatpak under a Wayland session the Tauri clipboard plugin has no
 * usable path: the manifest grants `--socket=wayland` with
 * `--socket=fallback-x11`, so the sandbox gets no `DISPLAY`, and `arboard`'s
 * Wayland backend needs a data-control protocol the compositor withholds from
 * sandboxed clients. It falls back to X11 and times out. WebKitGTK's clipboard
 * write goes through GTK instead, which the compositor does serve — so this
 * path is the one that works there, and it does not widen the sandbox.
 */
const writeViaWebview = async (value: string): Promise<void> => {
    if (!hasWebviewClipboard('writeText')) {
        throw new ClipboardUnavailableError('webview clipboard unavailable');
    }
    await navigator.clipboard.writeText(value);
};

/**
 * Writes a value, preferring the webview and falling back to the Tauri plugin.
 *
 * The webview is tried first because it is the only path that works in the
 * Flatpak-under-Wayland case, and because it is always available in the
 * webview contexts this app runs in. The plugin is kept as the fallback for
 * contexts without `navigator.clipboard`, so behaviour on Windows, macOS, the
 * .deb/AppImage and Flatpak-under-X11 is unchanged.
 *
 * Both paths failing is reported as a single `ClipboardUnavailableError` so
 * callers have one failure mode to handle.
 */
export const writeToClipboard = async (value: string): Promise<void> => {
    if (hasWebviewClipboard('writeText')) {
        try {
            await writeViaWebview(value);
            return;
        } catch (webviewError) {
            try {
                await writeText(value);
                return;
            } catch (pluginError) {
                throw new ClipboardUnavailableError({ webviewError, pluginError });
            }
        }
    }

    try {
        await writeText(value);
    } catch (pluginError) {
        throw new ClipboardUnavailableError({ pluginError });
    }
};

/**
 * Reads the clipboard, preferring the webview and falling back to the plugin.
 *
 * `ClipboardViewer` polls this, so a failing read must resolve to `undefined`
 * rather than throw — a thrown read would take the polling effect down with it.
 */
export const readFromClipboard = async (): Promise<string | undefined> => {
    if (hasWebviewClipboard('readText')) {
        try {
            return await navigator.clipboard.readText();
        } catch {
            // Fall through to the plugin.
        }
    }

    try {
        return await readText();
    } catch {
        return undefined;
    }
};

/**
 * Clears the clipboard, preferring the webview and falling back to the plugin.
 *
 * Used by the seed-phrase auto-wipe, which only fires when the clipboard still
 * holds exactly what was written. A failed clear is left to the caller to log.
 */
export const clearClipboard = async (): Promise<void> => {
    if (hasWebviewClipboard('writeText')) {
        try {
            // There is no standard "clear" on the web clipboard API; writing an
            // empty string is the closest equivalent and is what the plugin's
            // own webview fallback does.
            await navigator.clipboard.writeText('');
            return;
        } catch {
            // Fall through to the plugin.
        }
    }

    await clear();
};
