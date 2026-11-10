import {
    clear as clearWithTauriPlugin,
    readText as readWithTauriPlugin,
    writeText as writeWithTauriPlugin,
} from '@tauri-apps/plugin-clipboard-manager';

function getWebviewClipboard(): Clipboard | undefined {
    if (typeof navigator === 'undefined') {
        return undefined;
    }
    return navigator.clipboard;
}

function canUseExecCommand(): boolean {
    if (typeof document === 'undefined' || !document.body) {
        return false;
    }
    return typeof document.execCommand === 'function';
}

function saveCurrentSelection(): { selection: Selection | null; ranges: Range[] } {
    const selection = typeof window !== 'undefined' ? window.getSelection?.() ?? null : null;
    if (!selection) {
        return { selection: null, ranges: [] };
    }
    const ranges: Range[] = [];
    for (let i = 0; i < selection.rangeCount; i += 1) {
        ranges.push(selection.getRangeAt(i).cloneRange());
    }
    return { selection, ranges };
}

function restoreSelection(saved: { selection: Selection | null; ranges: Range[] }, activeElement: HTMLElement | null) {
    if (saved.selection) {
        saved.selection.removeAllRanges();
        for (const range of saved.ranges) {
            saved.selection.addRange(range);
        }
    }
    activeElement?.focus?.({ preventScroll: true });
}

function createOffscreenTextarea(text: string): HTMLTextAreaElement {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    return textarea;
}

// Copies text through an offscreen textarea when async IPC calls consumed transient user activation.
function execCommandCopy(text: string): boolean {
    if (!canUseExecCommand()) {
        return false;
    }
    const saved = saveCurrentSelection();
    const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const textarea = createOffscreenTextarea(text);

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
        restoreSelection(saved, activeElement);
    }
}

async function tryWebviewWrite(text: string): Promise<{ ok: true } | { ok: false; error?: unknown }> {
    const clipboard = getWebviewClipboard();
    if (typeof clipboard?.writeText !== 'function') {
        return { ok: false };
    }
    try {
        await clipboard.writeText(text);
        return { ok: true };
    } catch (error) {
        return { ok: false, error };
    }
}

async function runPluginFirst<T>(
    pluginAction: () => Promise<T>,
    webviewAction: ((clipboard: Clipboard) => Promise<T>) | undefined,
    fallbackMessage: string
): Promise<T> {
    let pluginError: unknown;
    try {
        return await pluginAction();
    } catch (err) {
        pluginError = err;
    }
    const clipboard = getWebviewClipboard();
    if (clipboard && webviewAction) {
        try {
            return await webviewAction(clipboard);
        } catch (webError) {
            throw webError ?? pluginError;
        }
    }
    throw pluginError ?? new Error(fallbackMessage);
}

/**
 * Write text to the system clipboard.
 *
 * Prefers the webview's `navigator.clipboard.writeText` (and `document.execCommand('copy')`
 * fallback) over `@tauri-apps/plugin-clipboard-manager` so that on Linux Flatpak under
 * Wayland - where `--socket=fallback-x11` withholds the X11 socket and compositors deny
 * `wlr-data-control` to sandboxed clients - the write succeeds immediately via WebKitGTK's
 * native Wayland surface while transient user activation is still valid.
 */
export async function writeClipboardText(text: string): Promise<void> {
    const webResult = await tryWebviewWrite(text);
    if (webResult.ok) {
        return;
    }
    if (text.length > 0 && execCommandCopy(text)) {
        return;
    }
    try {
        await writeWithTauriPlugin(text);
    } catch (pluginError) {
        throw pluginError ?? webResult.error;
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
    const clipboard = getWebviewClipboard();
    const fallback = typeof clipboard?.readText === 'function' ? (c: Clipboard) => c.readText() : undefined;
    return runPluginFirst(readWithTauriPlugin, fallback, 'Clipboard read is unavailable');
}

/**
 * Clear the system clipboard.
 *
 * Tries `@tauri-apps/plugin-clipboard-manager` first (works even when the window is unfocused
 * on X11/macOS/Windows) and falls back to overwriting with an empty string via the webview
 * clipboard API (for Wayland Flatpak where the native plugin has no X11/data-control access).
 */
export async function clearClipboardText(): Promise<void> {
    const clipboard = getWebviewClipboard();
    const fallback = typeof clipboard?.writeText === 'function' ? (c: Clipboard) => c.writeText('') : undefined;
    await runPluginFirst(clearWithTauriPlugin, fallback, 'Clipboard clear is unavailable');
}
