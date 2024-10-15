import { useUIStore } from '@app/store/useUIStore.ts';
import { useCallback } from 'react';
import { setAnimationProperties } from '@app/visuals.ts';

const animationLightBg = [
    { property: 'bgColor1', value: '#F6F6F6' },
    { property: 'bgColor2', value: '#EEEEEE' },
    { property: 'neutralColor', value: '#FFFFFF' },
    { property: 'mainColor', value: '#40d1f7' },
];

const animationDarkBg = [
    { property: 'bgColor1', value: '#1B1B1B' },
    { property: 'bgColor2', value: '#2E2E2E' },
    { property: 'neutralColor', value: '#b6b6b6' },
    { property: 'mainColor', value: '#0d81a1' },
];

export function useSwitchTheme() {
    const theme = useUIStore((s) => s.theme);
    const setTheme = useUIStore((s) => s.setTheme);
    const isDarkMode = theme === 'dark';

    return useCallback(() => {
        setTheme(isDarkMode ? 'light' : 'dark');
        setAnimationProperties(isDarkMode ? animationLightBg : animationDarkBg);
    }, [isDarkMode, setTheme]);
}

export function useThemeSetup() {
    const theme = useUIStore((s) => s.theme);
    return useCallback(() => {
        setAnimationProperties(theme === 'light' ? animationLightBg : animationDarkBg);
    }, [theme]);
}
