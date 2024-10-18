import { useCallback, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useUIStore } from '@app/store/useUIStore.ts';
import { Theme } from '@app/theme/types.ts';

export function useDetectMode() {
    const setSystemTheme = useUIStore((s) => s.setSystemTheme);

    useEffect(() => {
        const listener = listen('tauri://theme-changed', async ({ payload }) => {
            console.debug('wen2');
            if (payload) {
                const themePayload = payload as Theme;
                setSystemTheme(themePayload);
            }
        });
        return () => {
            listener.then((unlisten) => unlisten());
        };
    }, [setSystemTheme]);
}

export function useInitSystemMode() {
    const setSystemTheme = useUIStore((s) => s.setSystemTheme);
    const prefersDarkMode = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

    return useCallback(() => {
        console.debug('wen');
        setSystemTheme(prefersDarkMode() ? 'dark' : 'light');
    }, [setSystemTheme]);
}
