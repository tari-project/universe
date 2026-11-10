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
 * Writes text to the clipboard using the Tauri native clipboard plugin first,
 * falling back to the WebView `navigator.clipboard.writeText` API (e.g. under
 * Wayland Flatpak sandboxes where `arboard`'s X11 backend is unavailable).
 */
export async function writeClipboardText(value: string): Promise<void> {
    let firstError: unknown;
    try {
        await writeText(value);
        return;
    } catch (e) {
        firstError = e;
    }

    if (typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function') {
        try {
            await navigator.clipboard.writeText(value);
            return;
        } catch (fallbackError) {
            throw fallbackError ?? firstError;
        }
    }

    throw firstError;
}

async function readClipboardText(): Promise<string> {
    try {
        return await readText();
    } catch (firstError) {
        if (typeof navigator !== 'undefined' && typeof navigator.clipboard?.readText === 'function') {
            return await navigator.clipboard.readText();
        }
        throw firstError;
    }
}

async function clearClipboardText(): Promise<void> {
    let tauriSucceeded = false;
    let firstError: unknown;
    try {
        await clear();
        tauriSucceeded = true;
    } catch (e) {
        firstError = e;
    }

    if (typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function') {
        try {
            await navigator.clipboard.writeText('');
            return;
        } catch (fallbackError) {
            if (!tauriSucceeded) {
                throw fallbackError ?? firstError;
            }
        }
    } else if (!tauriSucceeded) {
        throw firstError;
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
