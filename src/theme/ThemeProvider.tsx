import { ReactNode } from 'react';
import { DefaultTheme, ThemeProvider as SCThemeProvider } from 'styled-components';
import { lightTheme, darkTheme } from './themes.ts';
import { useUIStore } from '@app/store/useUIStore.ts';
const themes = {
    dark: darkTheme,
    light: lightTheme,
};
export default function ThemeProvider({ children }: { children: ReactNode }) {
    const initialDarkMode = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const storedTheme = useUIStore((s) => s.theme);
    const theme = themes[storedTheme ?? (initialDarkMode ? 'dark' : 'light')] as DefaultTheme;
    return <SCThemeProvider theme={theme}>{children}</SCThemeProvider>;
}
