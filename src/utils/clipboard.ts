import { clear, readText, writeText } from '@tauri-apps/plugin-clipboard-manager';

/**
 * Shared clipboard access for the application with Wayland Flatpak fallback support.
 *
 * In the Linux Flatpak under a Wayland session, the Flatpak manifest grants
 * `--socket=wayland` and `--socket=fallback-x11`, so the sandbox has no `DISPLAY`.
 * The Tauri clipboard plugin backend (`arboard`) attempts to use the Wayland
 * data-control protocol, which compositors withhold from sandboxed clients, causing
 * it to fall back to X11 and fail with an unreachable connection error.
 *
 * WebKitGTK's webview provides `navigator.clipboard.writeText`, which interfaces
 * directly with the GTK clipboard without requiring privileged compositor protocols
 * or widening the sandbox with `--socket=x11`.
 *
 * Writes attempt `navigator.clipboard.writeText` first to avoid timeout latency
 * under Wayland, falling back to the Tauri plugin. Reads attempt the plugin first
 * (because scheduled secret wipe checks run without user interaction where webview
 * reads are restricted) with a webview fallback. Clear attempts plugin `clear()`
 * with an empty string write fallback.
 */

function getWebviewClipboard(): Clipboard | undefined {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
        return navigator.clipboard;
    }
    return undefined;
}

export async function writeClipboardText(text: string): Promise<void> {
    const webview = getWebviewClipboard();
    if (webview?.writeText) {
        try {
            await webview.writeText(text);
            return;
        } catch {
            // Webview clipboard write failed (e.g. lack of focus or permission);
            // fall back to native plugin.
        }
    }
    await writeText(text);
}

export async function readClipboardText(): Promise<string> {
    try {
        return await readText();
    } catch (pluginError) {
        const webview = getWebviewClipboard();
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
        const webview = getWebviewClipboard();
        if (webview?.writeText) {
            await webview.writeText('');
            return;
        }
        throw pluginError;
    }
}
