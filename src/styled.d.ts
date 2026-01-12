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
