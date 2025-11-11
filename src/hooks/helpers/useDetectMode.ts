import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { Theme } from '@app/theme/types.ts';
import { setUITheme, useConfigUIStore } from '@app/store';

export function useDetectMode() {
    const configTheme = useConfigUIStore((s) => s.display_mode);

    useEffect(() => {
        const listener = listen('tauri://theme-changed', async ({ payload }) => {
            if (payload && configTheme?.toLowerCase() === 'system') {
                const themePayload = payload as Theme;
                setUITheme(themePayload);
            }
        });
        return () => {
            listener.then((unlisten) => unlisten());
        };
    }, [configTheme]);
}
