import { useCallback, useEffect, useRef, useState } from 'react';
import { clearClipboardText, readClipboardText, writeClipboardText } from '@app/utils/clipboard';
import { addToast } from '@app/components/ToastStack/useToastStore';

export { clearClipboardText, readClipboardText, writeClipboardText };

export interface CopyOptions {
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
                    clearTimer.current = setTimeout(async () => {
                        const executeWipe = async (): Promise<boolean> => {
                            let current: string | undefined;
                            try {
                                current = await readClipboardText();
                            } catch {
                                // Reading may fail if unfocused under Wayland or permissions denied;
                                // proceed with attempting to clear.
                            }

                            if (current !== undefined && current !== value) {
                                // User copied something else in the meantime; leave it alone.
                                return true;
                            }

                            await clearClipboardText();
                            return true;
                        };

                        try {
                            await executeWipe();
                        } catch (wipeErr) {
                            console.warn(
                                'Scheduled clipboard wipe failed (window may be unfocused under Wayland); scheduling retry on focus:',
                                wipeErr
                            );

                            const isFocused =
                                typeof document !== 'undefined' &&
                                typeof document.hasFocus === 'function' &&
                                document.hasFocus();

                            if (typeof window !== 'undefined' && !isFocused) {
                                const onFocusRetry = async () => {
                                    window.removeEventListener('focus', onFocusRetry);
                                    try {
                                        await executeWipe();
                                    } catch (retryErr) {
                                        console.error(
                                            'Failed to clear sensitive clipboard data on focus retry:',
                                            retryErr
                                        );
                                        addToast({
                                            title: 'Clipboard wipe failed',
                                            text: 'Could not clear sensitive seed phrase from clipboard. Please clear your clipboard manually.',
                                            type: 'warning',
                                        });
                                    }
                                };
                                window.addEventListener('focus', onFocusRetry, { once: true });
                            } else {
                                addToast({
                                    title: 'Clipboard wipe failed',
                                    text: 'Could not clear sensitive seed phrase from clipboard. Please clear your clipboard manually.',
                                    type: 'warning',
                                });
                            }
                        }
                    }, options.clearAfterMs);
                }
            })
            .catch((e: unknown) => {
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
