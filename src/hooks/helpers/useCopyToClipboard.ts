import { useCallback, useEffect, useRef, useState } from 'react';
import { addToast } from '@app/components/ToastStack/useToastStore';
import { clearClipboard, readFromClipboard, writeToClipboard } from '@app/utils/clipboard';

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
        writeToClipboard(value)
            .then(() => {
                setIsCopied(true);
                onCopied?.();
                // This write replaced whatever the previous timer was guarding, so that
                // timer could only clear the new value early. A failed write leaves it.
                clearTimeout(clearTimer.current);
                if (options?.clearAfterMs) {
                    clearTimer.current = setTimeout(() => {
                        readFromClipboard()
                            .then((current) => {
                                if (current === value) {
                                    return clearClipboard();
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
