import { clear, readText, writeText } from '@tauri-apps/plugin-clipboard-manager';
import { useCallback, useEffect, useRef, useState } from 'react';
import { addToast } from '@app/components/ToastStack/useToastStore';

interface CopyOptions {
    /**
     * Wipe the value from the clipboard after this many ms, for secrets like a seed
     * phrase. The clear only fires if the clipboard still holds exactly what we wrote,
     * so copying something else in the meantime is left alone.
     */
    clearAfterMs?: number;
}

/** Raised when neither the Tauri plugin nor the webview could write the clipboard. */
export class ClipboardUnavailableError extends Error {
    constructor(readonly detail?: unknown) {
        super('Could not write to the clipboard');
        this.name = 'ClipboardUnavailableError';
    }
}

/**
 * Writes through the webview's own clipboard API.
 *
 * Inside the Flatpak under Wayland the Tauri clipboard plugin has no usable path:
 * the sandbox gets no `DISPLAY` (the manifest uses `--socket=wayland` with
 * `--socket=fallback-x11`), and `arboard`'s Wayland backend needs a data-control
 * protocol the compositor withholds from sandboxed clients, so it falls back to
 * X11 and times out. WebKitGTK's own clipboard write goes through GTK instead,
 * which the compositor does serve. This is the approach the issue prefers because
 * it does not widen the sandbox with `--socket=x11`.
 */
const writeViaWebview = async (value: string): Promise<void> => {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
        throw new ClipboardUnavailableError('webview clipboard unavailable');
    }
    await navigator.clipboard.writeText(value);
};

/**
 * Writes a value, preferring the Tauri plugin and falling back to the webview.
 *
 * The plugin is tried first so behaviour on Windows, macOS, the .deb/AppImage and
 * Flatpak-under-X11 stays exactly as it was; the webview path only runs when the
 * plugin is the thing that failed.
 */
const writeToClipboard = async (value: string): Promise<void> => {
    try {
        await writeText(value);
        return;
    } catch (pluginError) {
        try {
            await writeViaWebview(value);
            return;
        } catch (webviewError) {
            throw new ClipboardUnavailableError({ pluginError, webviewError });
        }
    }
};

export function useCopyToClipboard() {
    const [isCopied, setIsCopied] = useState(false);
    // The pending secret-clear timer. Deliberately left running on unmount: the seed
    // should leave the clipboard on schedule even after the user closes the screen.
    const clearTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        if (isCopied) {
            const copiedTimeout = setTimeout(() => {
                setIsCopied(false);
            }, 1500);
            return () => {
                clearTimeout(copiedTimeout);
            };
        }
    }, [isCopied]);

    const copyToClipboard = useCallback((value: string, onCopied?: () => void, options?: CopyOptions) => {
        writeToClipboard(value)
            .then(() => {
                setIsCopied(true);
                onCopied?.();
                // This write replaced whatever the previous timer was guarding, so that
                // timer could only clear the new value early. A failed write leaves it.
                clearTimeout(clearTimer.current);
                if (options?.clearAfterMs) {
                    clearTimer.current = setTimeout(() => {
                        readText()
                            .then((current) => {
                                if (current === value) {
                                    return clear();
                                }
                            })
                            .catch((e) => {
                                console.error('Could not clear clipboard', e);
                            });
                    }, options.clearAfterMs);
                }
            })
            .catch((e) => {
                // A silent failure is worst for secrets: the user assumes the seed
                // words are on the clipboard and pastes whatever was there before.
                console.error('Could not copy to clipboard', e);
                addToast({
                    title: 'Could not copy',
                    text: 'The clipboard did not accept the value. Select the text and copy it manually.',
                    type: 'error',
                });
            });
    }, []);

    return { copyToClipboard, isCopied };
}
