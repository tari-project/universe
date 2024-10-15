import { light, dark, componentSettings } from './tokens';
import { DefaultTheme } from 'styled-components';

export const THEME_TYPES = ['light', 'dark'] as const;
type ThemeTuple = typeof THEME_TYPES;
export type Theme = ThemeTuple[number];

const lightTheme: DefaultTheme = {
    ...light,
    ...componentSettings,
};

const darkTheme: DefaultTheme = {
    ...dark,
    ...componentSettings,
};

export { lightTheme, darkTheme };
