import { DefaultTheme } from 'styled-components';
import { componentSettings } from './components.ts';
import lightPalette from './palettes/light.ts';
import darkPalette from './palettes/dark.ts';

const lightTheme: DefaultTheme = {
    ...lightPalette,
    ...componentSettings,
};

const darkTheme = {
    ...darkPalette,
    ...componentSettings,
};

export { lightTheme, darkTheme };
