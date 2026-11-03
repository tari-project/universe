import { clear, readText, writeText } from '@tauri-apps/plugin-clipboard-manager';
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
    const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const clearGenerationRef = useRef(0);
    const pendingSecretRef = useRef<string | null>(null);

    useEffect(() => {
        return () => {
            clearGenerationRef.current += 1;
            if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
            const secret = pendingSecretRef.current;
            pendingSecretRef.current = null;
            if (secret) {
                readText()
                    .then((current) => {
                        if (current === secret) return clear();
                    })
                    .catch((e) => console.error('Could not clear clipboard', e));
            }
        };
    }, []);

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
        const previousSecret = pendingSecretRef.current;
        clearGenerationRef.current += 1;
        const generation = clearGenerationRef.current;
        if (clearTimeoutRef.current) {
            clearTimeout(clearTimeoutRef.current);
            clearTimeoutRef.current = null;
        }
        pendingSecretRef.current = null;
        writeText(value)
            .then(() => {
                if (clearGenerationRef.current !== generation) {
                    // This write finished after a newer copy began. If that newer
                    // copy failed, this secret may now be the clipboard value with
                    // no active timer, so remove it only if it is still there.
                    if (options?.clearAfterMs) {
                        readText()
                            .then((current) => {
                                if (pendingSecretRef.current !== value && current === value) {
                                    return clear();
                                }
                            })
                            .catch((e) => console.error('Could not clear clipboard', e));
                    }
                    return;
                }
                setIsCopied(true);
                onCopied?.();
                if (options?.clearAfterMs) {
                    pendingSecretRef.current = value;
                    clearTimeoutRef.current = setTimeout(() => {
                        clearTimeoutRef.current = null;
                        readText()
                            .then(async (current) => {
                                if (clearGenerationRef.current !== generation) return;
                                if (current === value) await clear();
                                if (clearGenerationRef.current === generation) pendingSecretRef.current = null;
                            })
                            .catch((e) => {
                                console.error('Could not clear clipboard', e);
                            });
                    }, options.clearAfterMs);
                }
            })
            .catch((e) => {
                console.error('Could not copy to clipboard', e);
                // A failed replacement leaves the previous secret in place. Clear it
                // now, since its original timer was canceled when this copy began.
                if (previousSecret && clearGenerationRef.current === generation) {
                    readText()
                        .then((current) => {
                            if (clearGenerationRef.current === generation && current === previousSecret) {
                                return clear();
                            }
                        })
                        .catch((clearError) => console.error('Could not clear clipboard', clearError));
                }
            });
    }, []);

    return { copyToClipboard, isCopied };
}
