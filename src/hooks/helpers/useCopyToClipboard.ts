import { useCallback, useEffect, useRef, useState } from 'react';
import { clearClipboardText, readClipboardText, writeClipboardText } from '@app/utils/clipboard';
import { addToast } from '@app/components/ToastStack/useToastStore';

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
                                addToast({
                                    title: 'Could not clear the clipboard',
                                    text: 'The copied value may still be on the clipboard.',
                                    type: 'warning',
                                });
                            });
                    }, options.clearAfterMs);
                }
            })
            .catch((e) => {
                console.error('Could not copy to clipboard', e);
                addToast({
                    title: 'Failed to copy to clipboard',
                    text: 'The clipboard did not accept the value. Select the text and copy it manually.',
                    type: 'error',
                });
            });
    }, []);

    return { copyToClipboard, isCopied };
}
