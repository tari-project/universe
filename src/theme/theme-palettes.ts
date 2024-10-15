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

import { colors } from './colors';
import { ThemePalette } from './types.ts';

const { tariPurple, grey, success, info, warning, error, green, tariPurpleAlpha, warningDarkAlpha, errorDarkAlpha } =
    colors;

export const lightPalette: ThemePalette = {
    mode: 'light',
    palette: {
        base: '#fff',
        contrast: '#000000',
        primary: {
            main: tariPurple[600],
            dark: tariPurple[700],
            light: tariPurple[500],
            shadow: tariPurpleAlpha[10],
            wisp: tariPurpleAlpha[5],
            contrast: '#FFFFFF',
        },
        secondary: {
            main: grey[700],
            dark: grey[800],
            light: grey[500],
            wisp: tariPurpleAlpha[5],
        },
        divider: 'rgba(0,0,0,0.06)',
        text: {
            primary: '#000000',
            secondary: '#797979',
            disabled: grey[400],
            contrast: '#FFFFFF',
        },
        background: {
            default: grey[50],
            paper: '#fff',
        },
        success: {
            main: success[200],
            dark: success[300],
            light: success[50],
            contrast: success[300],
        },
        warning: {
            main: warning[200],
            dark: warning[300],
            light: warning[100],
            contrast: warning[300],
            wisp: warningDarkAlpha[5],
        },
        error: {
            main: error[200],
            dark: error[300],
            light: error[100],
            contrast: error[300],
            wisp: errorDarkAlpha[5],
        },
        info: {
            main: info[200],
            dark: info[300],
            light: info[100],
            contrast: info[300],
        },
        action: {
            hover: 'rgba(0,0,0,0.02)',
        },
    },
    colors,
};

export const darkPalette: ThemePalette = {
    mode: 'dark',
    palette: {
        base: '#000',
        contrast: '#fff',
        primary: {
            main: tariPurple[900],
            dark: tariPurple[950],
            light: tariPurple[50],
            shadow: tariPurpleAlpha[80],
            wisp: tariPurpleAlpha[5],
            contrast: '#FFFFFF',
        },
        secondary: {
            main: green[500],
            dark: green[600],
            light: green[400],
            wisp: tariPurpleAlpha[5],
        },
        divider: 'rgba(255,255,255,0.1)',
        text: {
            primary: '#FFFFFF',
            secondary: grey[300],
            disabled: 'rgba(255,255,255,0.4)',
            contrast: '#000000',
        },
        background: {
            default: '#1D1D1D',
            paper: '#2A2A2A',
        },
        success: {
            main: success[200],
            dark: success[50],
            light: success[300],
            contrast: success[50],
        },
        warning: {
            main: colors.orange[500],
            dark: colors.orange[700],
            light: colors.orange[400],
            contrast: colors.orange[100],
            wisp: warningDarkAlpha[5],
        },
        error: {
            main: error[200],
            dark: error[100],
            light: error[300],
            contrast: error[100],
            wisp: errorDarkAlpha[5],
        },
        info: {
            main: info[200],
            dark: info[100],
            light: info[300],
            contrast: info[100],
        },
        action: {
            hover: 'rgba(255,255,255,0.1)',
        },
    },
    colors,
};
