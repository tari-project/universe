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

import { ThemePalette } from '../types.ts';
import { lightGradients } from '../gradients.ts';
import { colors as c } from './colors.ts';
import { colorsAlpha } from './colorsAlpha.ts';

const lightPalette: ThemePalette = {
    mode: 'light',
    palette: {
        base: '#fff',
        contrast: '#000000',
        contrastAlpha: colorsAlpha.darkAlpha[5],
        primary: {
            main: c.tariPurple[600],
            dark: c.tariPurple[700],
            light: c.tariPurple[500],
            shadow: colorsAlpha.tariPurpleAlpha[10],
            wisp: colorsAlpha.tariPurpleAlpha[5],
            contrast: '#FFFFFF',
            accent: c.grey[700],
            disabled: colorsAlpha.darkAlpha[5],
        },
        secondary: {
            main: c.grey[150],
            dark: c.grey[900],
            light: c.grey[50],
            wisp: colorsAlpha.tariPurpleAlpha[5],
        },
        divider: 'rgba(0,0,0,0.06)',
        text: {
            default: c.greyscale[900],
            main: c.tariPurple[600],
            primary: '#000000',
            secondary: '#797979',
            accent: 'rgba(0,0,0,0.6)',
            disabled: c.grey[400],
            contrast: '#FFFFFF',
            shadow: colorsAlpha.greyscaleAlpha[80],
        },
        background: {
            default: c.grey[50],
            main: c.grey[50],
            paper: '#fff',
            accent: c.grey[100],
            splash: '#e5e5e5',
        },
        success: {
            main: c.success[300],
            dark: c.success[950],
            light: c.success[100],
            contrast: c.success[900],
        },
        warning: {
            main: c.warning[400],
            dark: c.warning[800],
            light: c.warning[50],
            contrast: c.warning[300],
            wisp: colorsAlpha.warningDarkAlpha[5],
        },
        error: {
            main: c.error[400],
            dark: c.error[900],
            light: c.error[100],
            contrast: c.error[300],
            wisp: colorsAlpha.errorDarkAlpha[5],
        },
        action: {
            background: {
                default: c.grey[50],
                accent: c.grey[100],
                contrast: c.brightGreen[500],
                secondary: '#000',
                shadow: colorsAlpha.lightAlpha[50],
            },
            hover: {
                default: c.grey[150],
                accent: c.grey[100],
            },
            text: {
                light: '#fff',
                main: c.tariPurple[600],
                contrast: '#000',
            },
        },
        component: {
            main: '#000',
            accent: 'rgba(255,255,255,0.7)',
            contrast: '#fff',
        },
    },
    colors: c,
    colorsAlpha,
    gradients: lightGradients,
};

export default lightPalette;
