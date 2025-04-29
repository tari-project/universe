//  Copyright 2022. The Tari Project
//
//  Redistribution and use in source and binary forms, with or without modification, are permitted provided that the
//  following conditions are met:
//
//  1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following
//  disclaimer.
//
//  2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the
//  following disclaimer in the documentation and/or other materials provided with the distribution.
//
//  3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote
//  products derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
//  INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
//  DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
//  SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
//  SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
//  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
//  USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

import { ThemePalette } from '@app/theme/types.ts';
import { colors as c } from './colors.ts';
import { colorsAlpha, colorsAlpha as alpha } from './colorsAlpha.ts';
import { darkGradients } from '@app/theme/gradients.ts';

const darkPalette: ThemePalette = {
    mode: 'dark',
    palette: {
        base: '#000',
        contrast: '#fff',
        contrastAlpha: alpha.lightAlpha[5],
        primary: {
            main: c.tariPurple[900],
            dark: c.tariPurple[950],
            light: c.tariPurple[400],
            shadow: alpha.tariPurpleAlpha[20],
            wisp: alpha.tariPurpleAlpha[20],
            contrast: '#FFFFFF',
            disabled: colorsAlpha.lightAlpha[10],
            accent: c.grey[300],
        },
        secondary: {
            main: c.green[600],
            dark: c.green[700],
            light: c.green[500],
            wisp: alpha.tariPurpleAlpha[5],
        },
        divider: 'rgba(255,255,255,0.1)',
        text: {
            default: c.greyscale[100],
            main: c.tariPurple[300],
            primary: '#FFFFFF',
            accent: 'rgba(255,255,255,0.6)',
            secondary: c.grey[400],
            disabled: 'rgba(255,255,255,0.4)',
            contrast: '#000000',
            shadow: colorsAlpha.greyscaleAlpha[30],
        },
        background: {
            default: c.grey[900],
            paper: c.grey[700],
            accent: c.grey[400],
            main: c.grey[800],
            splash: '#2E2E2E',
            secondary: c.greyscale[900],
        },
        success: {
            main: c.green[600],
            dark: c.green[700],
            light: c.green[300],
            contrast: c.green[50],
        },
        warning: {
            main: c.orange[500],
            dark: c.orange[700],
            light: c.orange[400],
            contrast: c.orange[100],
            wisp: alpha.warningDarkAlpha[5],
        },
        error: {
            main: c.error[400],
            dark: c.error[950],
            light: c.error[700],
            contrast: c.error[100],
            wisp: alpha.errorDarkAlpha[5],
        },
        action: {
            background: {
                default: alpha.lightAlpha[10],
                accent: c.grey[850],
                contrast: '#000',
                secondary: c.brightGreen[500],
            },
            hover: {
                default: alpha.lightAlpha[5],
                accent: c.grey[800],
            },
            text: {
                main: '#fff',
                light: '#fff',
                contrast: '#000',
            },
        },
        component: {
            main: 'rgba(255,255,255,0.2)',
            accent: 'rgba(255,255,255,0.6)',
            contrast: '#fff',
        },
    },
    colors: c,
    colorsAlpha: alpha,
    gradients: darkGradients,
};
export default darkPalette;
