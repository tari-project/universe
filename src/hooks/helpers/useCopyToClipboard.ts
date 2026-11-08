import i18n from 'i18next';
import { useCallback, useEffect, useRef, useState } from 'react';
import { addToast } from '@app/components/ToastStack/useToastStore';
import { clearClipboardIfMatches, copyTextToClipboard } from '@app/utils/clipboard';

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

    /**
     * Copy `value`, trying the native plugin first and the webview clipboard
     * second. Resolves to true when the text was written, false when every
     * mechanism failed (in which case a toast is shown).
     */
    const copyToClipboard = useCallback(
        async (value: string, onCopied?: () => void, options?: CopyOptions): Promise<boolean> => {
            try {
                await copyTextToClipboard(value);
            } catch (e) {
                console.error('Could not copy to clipboard', e);
                addToast({
                    title: i18n.t('common:copy-failed'),
                    text: e instanceof Error ? e.message : String(e),
                    type: 'error',
                });
                return false;
            }

            setIsCopied(true);
            onCopied?.();
            // This write replaced whatever the previous timer was guarding, so that
            // timer could only clear the new value early. A failed write leaves it.
            clearTimeout(clearTimer.current);
            if (options?.clearAfterMs) {
                clearTimer.current = setTimeout(() => {
                    clearClipboardIfMatches(value).catch((e) => {
                        console.error('Could not clear clipboard', e);
                    });
                }, options.clearAfterMs);
            }
            return true;
        },
        []
    );

    return { copyToClipboard, isCopied };
}
