import { ReactNode } from 'react';
import { DefaultTheme, ThemeProvider as SCThemeProvider } from 'styled-components';
import { lightTheme, darkTheme } from './themes.ts';
import { useUIStore } from '@app/store/useUIStore.ts';
const themes = {
    dark: darkTheme,
    light: lightTheme,
};
export default function ThemeProvider({ children }: { children: ReactNode }) {
    const storedTheme = useUIStore((s) => s.theme);
    const initialPreferred = window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const themeName =
        !storedTheme || (storedTheme !== 'dark' && storedTheme !== 'light') ? initialPreferred : storedTheme; // if for some reason it was not stored, or stored as 'system'
    const theme = themes[themeName] as DefaultTheme;
    return <SCThemeProvider theme={theme}>{children}</SCThemeProvider>;
}
