import { useCallback, useEffect, useRef } from 'react';
import { Theme } from '@app/theme/types.ts';
import { invoke } from '@tauri-apps/api/core';
import { type } from '@tauri-apps/plugin-os';
import { setUITheme, useConfigUIStore } from '@app/store';

const initial = useConfigUIStore.getState().display_mode;
export function useDetectMode() {
    const displayModeRef = useRef(initial);

    useEffect(() => useConfigUIStore.subscribe((state) => (displayModeRef.current = state.display_mode)), []);

    const handleSystemTrayIcon = useCallback(async (systemDarkMode: boolean) => {
        const isMacOS = type() === 'macos';
        if (isMacOS) return;
        try {
            await invoke('set_theme_icon', { theme: systemDarkMode ? 'dark' : 'light' });
        } catch (e) {
            console.error(e);
        }
    }, []);

    useEffect(() => {
        function handleThemeChanged(systemDarkMode: boolean) {
            void handleSystemTrayIcon(systemDarkMode);
            const isSystem = displayModeRef.current == 'system';
            if (!isSystem) return;
            const newTheme: Theme = systemDarkMode ? 'dark' : 'light';
            setUITheme(newTheme);
        }
        window
            .matchMedia('(prefers-color-scheme: dark)')
            .addEventListener('change', (e) => handleThemeChanged(e.matches));

        handleThemeChanged(window.matchMedia('(prefers-color-scheme: dark)').matches);
        return () => {
            window
                .matchMedia('(prefers-color-scheme: dark)')
                .removeEventListener('change', (e) => handleThemeChanged(e.matches));
        };
    }, [handleSystemTrayIcon]);
}
