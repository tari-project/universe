import { DefaultTheme } from 'styled-components';
import { componentSettings } from './components.ts';
import { lightPalette, darkPalette } from './theme-palettes';

const lightTheme: DefaultTheme = {
    ...lightPalette,
    ...componentSettings,
};

const darkTheme = {
    ...darkPalette,
    ...componentSettings,
};

export { lightTheme, darkTheme };
