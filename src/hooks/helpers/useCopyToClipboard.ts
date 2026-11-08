import { addToast } from '@app/components/ToastStack/useToastStore.tsx';
import { clearClipboardText, readClipboardText, writeClipboardText } from '@app/utils/clipboard.ts';
import { useCallback, useEffect, useRef, useState } from 'react';

interface CopyOptions {
    /**
     * Wipe the value from the clipboard after this many ms, for secrets like a seed
     * phrase. The clear only fires if the clipboard still holds exactly what we wrote,
     * so copying something else in the meantime is left alone.
     */
    clearAfterMs?: number;
}

export function useCopyToClipboard() {
    const [isCopied, setIsCopied] = useState(false);
    // The pending secret-clear timer. Deliberately left running on unmount: the seed
    // should leave the clipboard on schedule even after the user closes the screen.
    const clearTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const cleanupFocusClear = useRef<(() => void) | undefined>(undefined);

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
                cleanupFocusClear.current?.();
                if (options?.clearAfterMs) {
                    clearTimer.current = setTimeout(() => {
                        readClipboardText()
                            .then(
                                (current) => current === value,
                                // On Wayland Flatpak, reading the clipboard from a background timer
                                // fails because neither X11/wlr-data-control nor a user gesture is
                                // available. Default to clearing the secret rather than leaving the
                                // seed phrase on the clipboard indefinitely.
                                () => true
                            )
                            .then((shouldClear) => {
                                if (shouldClear) {
                                    return clearClipboardText();
                                }
                            })
                            .catch((e) => {
                                console.error('Could not clear clipboard', e);
                                if (
                                    typeof window !== 'undefined' &&
                                    typeof document !== 'undefined' &&
                                    typeof document.hasFocus === 'function' &&
                                    !document.hasFocus()
                                ) {
                                    const onFocus = () => {
                                        cleanupFocusClear.current = undefined;
                                        clearClipboardText().catch((focusErr) => {
                                            console.error('Could not clear clipboard on focus', focusErr);
                                        });
                                    };
                                    window.addEventListener('focus', onFocus, { once: true });
                                    cleanupFocusClear.current = () => {
                                        window.removeEventListener('focus', onFocus);
                                        cleanupFocusClear.current = undefined;
                                    };
                                }
                            });
                    }, options.clearAfterMs);
                }
            })
            .catch((e) => {
                console.error('Could not copy to clipboard', e);
                addToast({
                    title: 'Could not copy to clipboard',
                    text: e instanceof Error ? e.message : String(e),
                    type: 'error',
                });
            });
    }, []);

    return { copyToClipboard, isCopied };
}
