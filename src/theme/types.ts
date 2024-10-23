import { Colours } from '@app/theme/palettes/colors.ts';
import { ColoursAlpha } from '@app/theme/palettes/colorsAlpha.ts';

export const THEME_TYPES = ['light', 'dark'] as const;
type ThemeTuple = typeof THEME_TYPES;
export type Theme = ThemeTuple[number];

export const COLOUR_TYPES = [
    'main',
    'dark',
    'light',
    'shadow',
    'wisp',
    'primary',
    'secondary',
    'disabled',
    'contrast',
    'accent',
    'default',
] as const;
type ColourTuple = typeof COLOUR_TYPES;
type ColourKey = ColourTuple[number];
export type Colour = { [key in ColourKey]?: string };
export type Gradients = { [key in ColourKey]?: string };

export interface ThemePalette {
    mode: Theme;
    palette: Palette;
    colors: Colours;
    colorsAlpha: ColoursAlpha;
    gradients: Gradients;
}

export interface Palette {
    base: string;
    contrast: string;
    contrastAlpha: string;
    primary: Colour;
    secondary: Colour;
    success: Colour;
    warning: Colour;
    error: Colour;
    text: Colour;
    component: Colour;
    divider: string;
    background: {
        default: string;
        splash: string;
        paper: string;
        accent: string;
        main: string;
    };
    action: {
        hover: Colour;
        background: Colour;
        text: Colour;
    };
}
