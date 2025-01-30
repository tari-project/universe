import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useUIStore } from '@app/store/useUIStore.ts';
import { Theme } from '@app/theme/types.ts';
import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';

export function useDetectMode() {
    const setTheme = useUIStore((s) => s.setTheme);
    const configTheme = useAppConfigStore((s) => s.display_mode);

    useEffect(() => {
        if (configTheme !== 'system') return;
        const listener = listen('tauri://theme-changed', async ({ payload }) => {
            if (payload) {
                const themePayload = payload as Theme;

                setTheme(themePayload);
            }
        });
        return () => {
            listener.then((unlisten) => unlisten());
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [configTheme]);
}
