import { useCallback, useEffect, useRef, useState } from 'react';
import i18n from 'i18next';
import {
    clearClipboardText,
    needsWebviewOnlyClipboard,
    readClipboardText,
    writeClipboardText,
} from '@app/utils/clipboard';
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
                if (!options?.clearAfterMs) {
                    clearTimeout(clearTimer.current);
                    return;
                }
                const clearAfterMs = options.clearAfterMs;
                return needsWebviewOnlyClipboard().then((webviewOnly) => {
                    // This write replaced whatever the previous timer was guarding, so that
                    // timer could only clear the new value early. A failed write leaves it.
                    clearTimeout(clearTimer.current);
                    if (webviewOnly) {
                        // Flatpak/Wayland: the timed wipe runs without a user gesture, which
                        // WebKitGTK refuses, so it could never clear. Tell the user instead.
                        addToast({
                            title: i18n.t('common:clipboard.not-auto-cleared-title'),
                            text: i18n.t('common:clipboard.not-auto-cleared-text'),
                            type: 'warning',
                        });
                        return;
                    }
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
                                    title: i18n.t('common:clipboard.clear-failed-title'),
                                    text: i18n.t('common:clipboard.clear-failed-text'),
                                    type: 'warning',
                                });
                            });
                    }, clearAfterMs);
                });
            })
            .catch((e) => {
                console.error('Could not copy to clipboard', e);
                addToast({
                    title: i18n.t('common:clipboard.copy-failed-title'),
                    text: i18n.t('common:clipboard.copy-failed-text'),
                    type: 'error',
                });
            });
    }, []);

    return { copyToClipboard, isCopied };
}
