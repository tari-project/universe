import { t } from 'i18next';
import { useCallback, useEffect, useRef, useState } from 'react';
import { addToast } from '@app/components/ToastStack/useToastStore';
import { clearClipboardText, readClipboardText, writeClipboardText } from '@app/utils/clipboard';

/**
 * Wipe `value` only if the clipboard still holds it. A Wayland compositor can refuse
 * the read or the clear while the window is in the background; retry once it is focused
 * so a seed phrase does not stay on the clipboard just because the timer fired unfocused.
 */
async function clearCopiedSecret(value: string, retryOnFocus: boolean): Promise<void> {
    try {
        const current = await readClipboardText();
        if (current === value) {
            await clearClipboardText();
        }
    } catch (e) {
        console.error('Could not clear clipboard', e);
        if (retryOnFocus && typeof document !== 'undefined' && !document.hasFocus()) {
            window.addEventListener('focus', () => void clearCopiedSecret(value, false), { once: true });
        }
    }
}

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
        return writeClipboardText(value)
            .then(() => {
                setIsCopied(true);
                onCopied?.();
                // This write replaced whatever the previous timer was guarding, so that
                // timer could only clear the new value early. A failed write leaves it.
                clearTimeout(clearTimer.current);
                if (options?.clearAfterMs) {
                    clearTimer.current = setTimeout(() => {
                        void clearCopiedSecret(value, true);
                    }, options.clearAfterMs);
                }
            })
            .catch((e) => {
                console.error('Could not copy to clipboard', e);
                addToast({ title: t('copy-failed', { ns: 'common' }), type: 'error' });
            });
    }, []);

    return { copyToClipboard, isCopied };
}
