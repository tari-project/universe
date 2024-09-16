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

const {
    tariPurple,
    grey,
    success,
    info,
    warning,
    error,
    brightGreen,
    tariPurpleAlpha,
    warningDarkAlpha,
    errorDarkAlpha,
} = colors;

export const light = {
    palette: {
        mode: 'light',
        base: '#fff',
        contrast: '#000000',
        primary: {
            main: tariPurple[600],
            dark: tariPurple[800],
            light: tariPurple[400],
            shadow: tariPurpleAlpha[10],
            wisp: tariPurpleAlpha[5],
        },
        secondary: {
            main: brightGreen[600],
            dark: brightGreen[700],
            light: brightGreen[500],
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
            light: success[100],
            contrastText: success[300],
        },
        warning: {
            main: warning[200],
            dark: warning[300],
            light: warning[100],
            contrastText: warning[300],
            wisp: warningDarkAlpha[5],
        },
        error: {
            main: error[200],
            dark: error[300],
            light: error[100],
            contrastText: error[300],
            wisp: errorDarkAlpha[5],
        },
        info: {
            main: info[200],
            dark: info[300],
            light: info[100],
            contrastText: info[300],
        },
        action: {
            hover: 'rgba(0,0,0,0.02)',
        },
        colors,
    },
};

export const dark = {
    palette: {
        mode: 'dark',
        base: '#000',
        contrast: '#fff',
        primary: {
            main: tariPurple[500],
            dark: tariPurple[200],
            light: tariPurple[50],
            shadow: tariPurpleAlpha[80],
            wisp: tariPurpleAlpha[5],
        },
        secondary: {
            main: brightGreen[500],
            dark: brightGreen[400],
            light: brightGreen[600],
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
            dark: success[100],
            light: success[300],
            contrastText: success[100],
        },
        warning: {
            main: warning[200],
            dark: warning[100],
            light: warning[300],
            contrastText: warning[100],
            wisp: warningDarkAlpha[5],
        },
        error: {
            main: error[200],
            dark: error[100],
            light: error[300],
            contrastText: error[100],
            wisp: errorDarkAlpha[5],
        },
        info: {
            main: info[200],
            dark: info[100],
            light: info[300],
            contrastText: info[100],
        },
        action: {
            hover: 'rgba(255,255,255,0.1)',
        },
        colors,
    },
};

export const componentSettings = {
    shape: {
        borderRadius: {
            app: '10px',
            button: '30px',
            buttonSquared: '10px',
        },
    },
    typography: {
        fontFamily: '"Poppins", sans-serif',
        fontSize: '16px',
        fontWeight: 400,
        span: {
            lineHeight: 1.1,
            letterSpacing: '-0.1px',
            fontWeight: 'inherit',
        },
        p: {
            fontSize: '12px',
            lineHeight: 1.1,
            letterSpacing: '-0.1px',
            fontWeight: 400,
        },
        h1: {
            fontSize: '30px',
            lineHeight: '42px',
            fontFamily: '"Poppins", sans-serif',
            letterSpacing: '-0.4px',
            fontWeight: 600,
        },
        h2: {
            fontSize: '26px',
            lineHeight: '36px',
            fontWeight: 600,
            fontFamily: '"Poppins", sans-serif',
            letterSpacing: '-1.2px',
        },
        h3: {
            fontSize: '24px',
            lineHeight: '32px',
            fontFamily: '"Poppins", sans-serif',
            letterSpacing: '-0.4px',
            fontWeight: 600,
        },
        h4: {
            fontSize: '20px',
            lineHeight: '28px',
            fontFamily: '"Poppins", sans-serif',
            fontWeight: 600,
            letterSpacing: '-1.6px',
        },
        h5: {
            fontSize: '16px',
            lineHeight: '1.05',
            fontFamily: '"Poppins", sans-serif',
            letterSpacing: '-0.4px',
            fontWeight: 600,
        },
        h6: {
            fontSize: '14px',
            lineHeight: '20px',
            fontFamily: '"Poppins", sans-serif',
            letterSpacing: '-0.4px',
            fontWeight: 500,
        },
    },
};

export type ThemeComponents = typeof componentSettings;

export type Palette = typeof dark.palette | typeof light.palette;
