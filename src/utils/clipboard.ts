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

function webviewClipboard(): Clipboard | undefined {
    if (typeof navigator === 'undefined') return undefined;
    return navigator.clipboard;
}

export async function writeClipboardText(text: string): Promise<void> {
    const webview = webviewClipboard();
    if (webview?.writeText) {
        try {
            await webview.writeText(text);
            return;
        } catch {
            // Fall through to the plugin: the webview refused (permissions, focus,
            // unsupported webview), but the native path may still work.
        }
    }
    await writeText(text);
}

export async function readClipboardText(): Promise<string> {
    try {
        return await readText();
    } catch (pluginError) {
        const webview = webviewClipboard();
        if (webview?.readText) {
            return await webview.readText();
        }
        throw pluginError;
    }
}

export async function clearClipboardText(): Promise<void> {
    try {
        await clear();
    } catch (pluginError) {
        const webview = webviewClipboard();
        if (webview?.writeText) {
            return await webview.writeText('');
        }
        throw pluginError;
    }
}
