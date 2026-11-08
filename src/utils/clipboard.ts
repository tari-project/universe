import { clear, readText, writeText } from '@tauri-apps/plugin-clipboard-manager';

/**
 * Where the last successful write went. Kept for logging/tests; callers
 * normally only care whether the promise resolved.
 */
export type ClipboardWriteMethod = 'tauri' | 'webview' | 'execCommand';

export class ClipboardWriteError extends Error {
    readonly attempts: string[];

    constructor(attempts: string[]) {
        super(`Could not write to the clipboard (${attempts.join('; ')})`);
        this.name = 'ClipboardWriteError';
        this.attempts = attempts;
    }
}

function describeError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/**
 * How long to wait for the arboard-backed plugin before giving up on it.
 *
 * Inside the Flatpak sandbox on Wayland, arboard cannot use the compositor's
 * data-control protocol, falls back to X11 and then blocks on a connection that
 * does not exist. It does not reject — it hangs — so a bare `await` would freeze
 * the copy button instead of letting us fall through to the webview.
 */
export const PLUGIN_TIMEOUT_MS = 1200;

function withPluginTimeout<T>(operation: Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`tauri clipboard timed out after ${PLUGIN_TIMEOUT_MS}ms`));
        }, PLUGIN_TIMEOUT_MS);
        operation.then(
            (value) => {
                clearTimeout(timer);
                resolve(value);
            },
            (error) => {
                clearTimeout(timer);
                reject(error);
            }
        );
    });
}

/**
 * Write through the Tauri plugin. This is the only path on Windows/macOS and
 * it works on Linux X11, so those platforms keep their existing behaviour.
 */
async function writeViaTauri(text: string): Promise<void> {
    await withPluginTimeout(writeText(text));
}

/**
 * Write through the webview's own clipboard (WebKitGTK on Linux). Inside the
 * Flatpak sandbox the Tauri plugin uses arboard, which falls back to X11 and
 * fails on a pure Wayland session. WebKitGTK talks to the compositor over the
 * Wayland connection it already has, so this works without `--socket=x11`.
 */
async function writeViaWebview(text: string): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
        throw new Error('navigator.clipboard.writeText is unavailable');
    }
    await navigator.clipboard.writeText(text);
}

/**
 * Last resort for webviews where the async Clipboard API is missing or was
 * denied (for example when the user gesture expired behind a PIN dialog).
 */
function writeViaExecCommand(text: string): void {
    if (typeof document === 'undefined' || typeof document.execCommand !== 'function') {
        throw new Error('document.execCommand is unavailable');
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    // Keep it out of view without using `display: none`, which makes the
    // selection impossible in some engines.
    textarea.style.position = 'fixed';
    textarea.style.top = '-1000px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    try {
        textarea.select();
        textarea.setSelectionRange(0, text.length);
        if (!document.execCommand('copy')) {
            throw new Error('document.execCommand("copy") returned false');
        }
    } finally {
        document.body.removeChild(textarea);
    }
}

/**
 * Copy text using the first mechanism that works.
 *
 * Order matters: the native plugin is tried first so Windows, macOS,
 * .deb/AppImage and Flatpak-under-X11 behave exactly as before. The webview
 * clipboard only takes over when the plugin itself failed.
 */
export async function copyTextToClipboard(text: string): Promise<ClipboardWriteMethod> {
    const attempts: string[] = [];

    try {
        await writeViaTauri(text);
        return 'tauri';
    } catch (error) {
        attempts.push(`tauri: ${describeError(error)}`);
    }

    try {
        await writeViaWebview(text);
        return 'webview';
    } catch (error) {
        attempts.push(`webview: ${describeError(error)}`);
    }

    try {
        writeViaExecCommand(text);
        return 'execCommand';
    } catch (error) {
        attempts.push(`execCommand: ${describeError(error)}`);
    }

    throw new ClipboardWriteError(attempts);
}

/**
 * Read the clipboard, falling back to the webview when the plugin cannot reach
 * it (same Flatpak/Wayland failure as writes). Returns null when every path
 * failed, so callers can distinguish "empty" from "unavailable".
 */
export async function readClipboardText(): Promise<string | null> {
    try {
        return await withPluginTimeout(readText());
    } catch {
        // fall through
    }

    try {
        if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
            return await navigator.clipboard.readText();
        }
    } catch {
        // fall through
    }

    return null;
}

/**
 * Wipe a secret from the clipboard, but only if it is still the value we put
 * there. Uses the same fallback chain as writes so it also works under
 * Flatpak/Wayland.
 */
export async function clearClipboardIfMatches(value: string): Promise<void> {
    const current = await readClipboardText();
    if (current !== value) return;

    try {
        await withPluginTimeout(clear());
        return;
    } catch {
        // The plugin clear() is arboard-backed too; overwrite through the
        // webview instead.
    }

    await copyTextToClipboard('');
}
