import { invoke } from '@tauri-apps/api/core';
import { clear, readText, writeText } from '@tauri-apps/plugin-clipboard-manager';

/**
 * Flatpak on Wayland has a Wayland socket and no X11 display, so the clipboard
 * plugin (arboard) cannot reach a clipboard and its X11 fallback hangs. The
 * webview writes through WebKitGTK's clipboard, which the compositor does serve.
 * Everywhere else the plugin stays first, so Windows, macOS, deb/AppImage, and
 * Flatpak-on-X11 keep the path they already use.
 */
const webviewPreferred: Promise<boolean> = invoke('clipboard_needs_webview')
    .then((value) => value === true)
    .catch(() => false);

async function prefersWebview(override?: boolean): Promise<boolean> {
    if (override !== undefined) return override;
    return webviewPreferred;
}

function copyViaExecCommand(text: string): boolean {
    if (typeof document === 'undefined' || typeof document.execCommand !== 'function' || !document.body) {
        return false;
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    let copied = false;
    try {
        copied = document.execCommand('copy');
    } catch {
        copied = false;
    } finally {
        document.body.removeChild(textarea);
    }
    return copied;
}

async function copyViaWebview(text: string): Promise<boolean> {
    const write = navigator.clipboard?.writeText?.bind(navigator.clipboard);
    if (write) {
        try {
            await write(text);
            return true;
        } catch {
            // A rejected async write (permission, or the click's activation expired)
            // can still succeed through the synchronous GTK clipboard path.
        }
    }
    return copyViaExecCommand(text);
}

export interface ClipboardRouteOptions {
    /** When set, skips the Flatpak/Wayland detection. */
    preferWebview?: boolean;
}

export async function writeClipboardText(text: string, options?: ClipboardRouteOptions): Promise<void> {
    if (await prefersWebview(options?.preferWebview)) {
        // Do not fall through to the plugin here: on this sandbox it blocks on an
        // unreachable X11 server long enough to freeze the click.
        if (await copyViaWebview(text)) return;
        throw new Error('Could not copy to the clipboard');
    }

    try {
        await writeText(text);
    } catch (pluginError) {
        if (await copyViaWebview(text)) return;
        throw pluginError instanceof Error ? pluginError : new Error('Could not copy to the clipboard');
    }
}

export async function readClipboardText(options?: ClipboardRouteOptions): Promise<string> {
    if (await prefersWebview(options?.preferWebview)) {
        const read = navigator.clipboard?.readText?.bind(navigator.clipboard);
        if (!read) throw new Error('Could not read the clipboard');
        return read();
    }

    try {
        return await readText();
    } catch (pluginError) {
        const read = navigator.clipboard?.readText?.bind(navigator.clipboard);
        if (read) {
            try {
                return await read();
            } catch {
                // Report the plugin failure; this platform's clipboard is the plugin.
            }
        }
        throw pluginError instanceof Error ? pluginError : new Error('Could not read the clipboard');
    }
}

export async function clearClipboardText(options?: ClipboardRouteOptions): Promise<void> {
    if (await prefersWebview(options?.preferWebview)) {
        if (await copyViaWebview('')) return;
        throw new Error('Could not clear the clipboard');
    }

    try {
        await clear();
    } catch (pluginError) {
        if (await copyViaWebview('')) return;
        throw pluginError instanceof Error ? pluginError : new Error('Could not clear the clipboard');
    }
}
