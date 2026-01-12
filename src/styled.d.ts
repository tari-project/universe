import {} from 'react';
import type { CSSProp } from 'styled-components';
import 'styled-components';
import { ThemePalette } from '@app/theme/types.ts';
import { ThemeComponents } from '@app/theme/components.ts';

declare module 'styled-components' {
    export interface DefaultTheme extends ThemeComponents {
        mode: ThemePalette['mode'];
        palette: ThemePalette['palette'];
        colors: ThemePalette['colors'];
        colorsAlpha: ThemePalette['colorsAlpha'];
        gradients: ThemePalette['gradients'];
    }
}

declare module 'react' {
    interface Attributes {
        css?: CSSProp | undefined;
    }
}
