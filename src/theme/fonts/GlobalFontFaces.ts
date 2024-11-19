import { createGlobalStyle } from 'styled-components';
import { druk_fonts } from './druk.ts';
import { poppins_fonts } from './poppins.ts';
import { gt_america_fonts } from '@app/theme/fonts/gt-america.ts';

export const GlobalFontFace = createGlobalStyle`
    ${druk_fonts}
    ${gt_america_fonts}
    ${poppins_fonts}
`;
