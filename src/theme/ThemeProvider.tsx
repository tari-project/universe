import { ReactNode } from 'react';
import { DefaultTheme, ThemeProvider as SCThemeProvider } from 'styled-components';
import { lightTheme, darkTheme } from './themes.ts';
import { useUIStore } from '@app/store/useUIStore.ts';
const themes = {
    dark: darkTheme,
    light: lightTheme,
};
export default function ThemeProvider({ children }: { children: ReactNode }) {
    const preferredTheme = useUIStore((s) => s.preferredTheme);
    const uiTheme = useUIStore((s) => s.theme);
    // if for some reason it was not stored, or stored as 'system'
    const themeName = !uiTheme || (uiTheme !== 'dark' && uiTheme !== 'light') ? preferredTheme : uiTheme;
    const theme = themes[themeName] as DefaultTheme;
    return <SCThemeProvider theme={theme}>{children}</SCThemeProvider>;
}
