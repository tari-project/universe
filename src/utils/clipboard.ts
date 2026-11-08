import {
    clear as clearWithTauriPlugin,
    readText as readWithTauriPlugin,
    writeText as writeWithTauriPlugin,
} from '@tauri-apps/plugin-clipboard-manager';

function execCommandCopy(text: string): boolean {
    if (typeof document === 'undefined' || typeof document.execCommand !== 'function' || !document.body) {
        return false;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';

    const selection = typeof window !== 'undefined' ? window.getSelection?.() : null;
    const savedRanges: Range[] = [];
    if (selection) {
        for (let i = 0; i < selection.rangeCount; i += 1) {
            savedRanges.push(selection.getRangeAt(i).cloneRange());
        }
    }
    const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    document.body.appendChild(textarea);
    try {
        textarea.focus({ preventScroll: true });
        textarea.select();
        textarea.setSelectionRange(0, text.length);
        return document.execCommand('copy');
    } catch {
        return false;
    } finally {
        document.body.removeChild(textarea);
        if (selection) {
            selection.removeAllRanges();
            for (const range of savedRanges) {
                selection.addRange(range);
            }
        }
        activeElement?.focus?.({ preventScroll: true });
    }
}

/**
 * Write text to the system clipboard.
 *
 * Prefers the webview's `navigator.clipboard.writeText` (and `document.execCommand('copy')`
 * fallback) over `@tauri-apps/plugin-clipboard-manager` so that on Linux Flatpak under
 * Wayland — where `--socket=fallback-x11` withholds the X11 socket and compositors deny
 * `wlr-data-control` to sandboxed clients — the write succeeds immediately via WebKitGTK's
 * native Wayland surface while transient user activation is still valid.
 */
export async function writeClipboardText(text: string): Promise<void> {
    let webError: unknown;

    if (typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function') {
        try {
            await navigator.clipboard.writeText(text);
            return;
        } catch (err) {
            webError = err;
        }
    }

    if (text.length > 0 && execCommandCopy(text)) {
        return;
    }

    try {
        await writeWithTauriPlugin(text);
    } catch (pluginError) {
        throw pluginError ?? webError;
    }
}

/**
 * Read text from the system clipboard.
 *
 * Tries `@tauri-apps/plugin-clipboard-manager` first (which works without user gesture or
 * browser permission prompts when a native display backend is available) and falls back
 * to `navigator.clipboard.readText()` (e.g. under Wayland Flatpak).
 */
export async function readClipboardText(): Promise<string> {
    let pluginError: unknown;

    try {
        return await readWithTauriPlugin();
    } catch (err) {
        pluginError = err;
    }

    if (typeof navigator !== 'undefined' && typeof navigator.clipboard?.readText === 'function') {
        try {
            return await navigator.clipboard.readText();
        } catch (webError) {
            throw webError ?? pluginError;
        }
    }

    throw pluginError ?? new Error('Clipboard read is unavailable');
}

/**
 * Clear the system clipboard.
 *
 * Tries `@tauri-apps/plugin-clipboard-manager` first (works even when the window is unfocused
 * on X11/macOS/Windows) and falls back to overwriting with an empty string via the webview
 * clipboard API (for Wayland Flatpak where the native plugin has no X11/data-control access).
 */
export async function clearClipboardText(): Promise<void> {
    let pluginError: unknown;

    try {
        await clearWithTauriPlugin();
        return;
    } catch (err) {
        pluginError = err;
    }

    if (typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function') {
        try {
            await navigator.clipboard.writeText('');
            return;
        } catch (webError) {
            throw webError ?? pluginError;
        }
    }

    throw pluginError ?? new Error('Clipboard clear is unavailable');
}
