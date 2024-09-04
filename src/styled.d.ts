// import original module declarations
import 'styled-components';
import { Palette, ThemeComponents } from '@app/theme/tokens.ts';
import { Colours } from '@app/theme/colors.ts';

// and extend them!
declare module 'styled-components' {
    export interface DefaultTheme extends ThemeComponents {
        palette: Palette;
        colors?: Colours;
    }
}
