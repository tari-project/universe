import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { useCallback, useEffect, useState } from 'react';

export function useCopyToClipboard() {
    const [isCopied, setIsCopied] = useState(false);

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

    const copyToClipboard = useCallback((value: string, onCopied?: () => void) => {
        console.debug(value);
        writeText(value)
            .then(() => {
                setIsCopied(true);
                onCopied?.();
            })
            .catch((e) => {
                console.error('Could not copy to clipboard', e);
            });
    }, []);

    return { copyToClipboard, isCopied };
}
