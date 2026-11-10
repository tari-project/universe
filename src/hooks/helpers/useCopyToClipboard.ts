import { clear, readText, writeText } from '@tauri-apps/plugin-clipboard-manager';
import { addToast } from '@app/components/ToastStack/useToastStore';
import { useCallback, useEffect, useRef, useState } from 'react';

interface CopyOptions {
    /**
     * Wipe the value from the clipboard after this many ms, for secrets like a seed
     * phrase. The clear only fires if the clipboard still holds exactly what we wrote,
     * so copying something else in the meantime is left alone.
     */
    clearAfterMs?: number;
}

/**
 * Writes text to the system clipboard via the Tauri clipboard plugin, falling back to
 * `navigator.clipboard.writeText` (WebKitGTK's native GTK Wayland clipboard) when the
 * sandboxed native backend (`arboard`) cannot reach X11 or privileged Wayland data-control
 * protocols inside a Linux Flatpak Wayland session.
 */
export async function writeClipboardText(value: string): Promise<void> {
    try {
        await writeText(value);
        return;
    } catch (pluginError) {
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(value);
            return;
        }
        throw pluginError;
    }
}

/**
 * Reads text from the system clipboard via the Tauri clipboard plugin, falling back to
 * `navigator.clipboard.readText` when the native clipboard backend is unavailable.
 */
export async function readClipboardText(): Promise<string> {
    try {
        return await readText();
    } catch (pluginError) {
        if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
            return await navigator.clipboard.readText();
        }
        throw pluginError;
    }
}

/**
 * Clears the system clipboard via the Tauri clipboard plugin, falling back to writing an
 * empty string through `navigator.clipboard.writeText` under sandboxed Wayland sessions.
 */
export async function clearClipboardText(): Promise<void> {
    try {
        await clear();
        return;
    } catch (pluginError) {
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText('');
            return;
        }
        throw pluginError;
    }
}

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
        writeClipboardText(value)
            .then(() => {
                setIsCopied(true);
                onCopied?.();
                // This write replaced whatever the previous timer was guarding, so that
                // timer could only clear the new value early. A failed write leaves it.
                clearTimeout(clearTimer.current);
                if (options?.clearAfterMs) {
                    clearTimer.current = setTimeout(() => {
                        readClipboardText()
                            .then((current) => {
                                if (current === value) {
                                    return clearClipboardText();
                                }
                            })
                            .catch((e) => {
                                console.error('Could not clear clipboard', e);
                            });
                    }, options.clearAfterMs);
                }
            })
            .catch((e) => {
                console.error('Could not copy to clipboard', e);
                addToast({
                    title: 'Failed to copy to clipboard',
                    text: e instanceof Error ? e.message : String(e),
                    type: 'error',
                });
            });
    }, []);

    return { copyToClipboard, isCopied };
}
