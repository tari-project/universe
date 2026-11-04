import { useEffect } from 'react';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { Theme } from '@app/theme/types.ts';
import { setUITheme, useConfigUIStore } from '@app/store';

export function useDetectMode() {
    useEffect(() => {
        let cancelled = false;
        let unlistenFn: UnlistenFn | null = null;

        listen('tauri://theme-changed', async ({ payload }) => {
            if (cancelled) return;
            const configTheme = useConfigUIStore.getState().display_mode;
            if (payload && configTheme?.toLowerCase() === 'system') {
                const themePayload = payload as Theme;
                setUITheme(themePayload);
            }
        }).then((unlisten) => {
            if (cancelled) {
                unlisten();
            } else {
                unlistenFn = unlisten;
            }
        });

        return () => {
            cancelled = true;
            unlistenFn?.();
        };
    }, []);
}
