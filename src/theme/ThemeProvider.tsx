import { ReactNode } from 'react';
import { DefaultTheme, ThemeProvider as SCThemeProvider } from 'styled-components';
import { lightTheme } from './themes.ts';

export default function ThemeProvider({ children }: { children: ReactNode }) {
    const theme = lightTheme as DefaultTheme;
    return <SCThemeProvider theme={theme}>{children}</SCThemeProvider>;
}
