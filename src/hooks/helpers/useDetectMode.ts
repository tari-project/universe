import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { Theme } from '@app/theme/types.ts';
import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';
import { setUITheme } from '@app/store';

export function useDetectMode() {
    const configTheme = useAppConfigStore((s) => s.display_mode);

    useEffect(() => {
        if (configTheme !== 'system') return;
        const listener = listen('tauri://theme-changed', async ({ payload }) => {
            if (payload) {
                const themePayload = payload as Theme;
                setUITheme(themePayload);
            }
        });
        return () => {
            listener.then((unlisten) => unlisten());
        };
    }, [configTheme]);
}
