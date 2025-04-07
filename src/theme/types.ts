import { Colours } from '@app/theme/palettes/colors.ts';
import { ColoursAlpha } from '@app/theme/palettes/colorsAlpha.ts';

const _THEME_TYPES = ['light', 'dark'] as const;
type ThemeTuple = typeof _THEME_TYPES;
export type Theme = ThemeTuple[number];

const _COLOUR_TYPES = [
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
type ColourTuple = typeof _COLOUR_TYPES;
type ColourKey = ColourTuple[number];

type StandardColour = Record<ColourKey, string>;
type Colour = Partial<Record<ColourKey, string>>;
type GraidentKey = 'setupBg' | 'radialBg' | 'miningButtonStarted' | 'miningButtonHover' | ColourKey;
type Gradients = Partial<Record<GraidentKey, string>>;

export interface ThemePalette {
    mode: Theme;
    palette: Palette;
    colors: Colours;
    colorsAlpha: ColoursAlpha;
    gradients: Gradients;
}

interface Palette {
    base: string;
    contrast: string;
    contrastAlpha: string;
    primary: Omit<StandardColour, 'primary' | 'secondary' | 'default'>;
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
