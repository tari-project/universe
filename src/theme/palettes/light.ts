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
import { colors as c } from '@app/theme/colors.ts';
import { lightGradients } from '@app/theme/gradients.ts';

const lightPalette: ThemePalette = {
    mode: 'light',
    palette: {
        base: '#fff',
        contrast: '#000000',
        contrastAlpha: c.darkAlpha[5],
        primary: {
            main: c.tariPurple[600],
            dark: c.tariPurple[700],
            light: c.tariPurple[500],
            shadow: c.tariPurpleAlpha[10],
            wisp: c.tariPurpleAlpha[5],
            contrast: '#FFFFFF',
        },
        secondary: {
            main: c.grey[150],
            dark: c.grey[900],
            light: c.grey[50],
            wisp: c.tariPurpleAlpha[5],
        },
        divider: 'rgba(0,0,0,0.06)',
        text: {
            main: c.tariPurple[600],
            primary: '#000000',
            secondary: '#797979',
            disabled: c.grey[400],
            contrast: '#FFFFFF',
        },
        background: {
            default: c.grey[50],
            paper: '#fff',
            accent: c.grey[100],
        },
        success: {
            main: c.success[200],
            dark: c.success[300],
            light: c.success[100],
            contrast: c.success[300],
        },
        warning: {
            main: c.warning[200],
            dark: c.warning[300],
            light: c.warning[100],
            contrast: c.warning[300],
            wisp: c.warningDarkAlpha[5],
        },
        error: {
            main: c.error[200],
            dark: c.error[300],
            light: c.error[100],
            contrast: c.error[300],
            wisp: c.errorDarkAlpha[5],
        },
        info: {
            main: c.info[200],
            dark: c.info[300],
            light: c.info[100],
            contrast: c.info[300],
        },
        action: {
            background: {
                default: c.grey[50],
                accent: c.grey[100],
                contrast: c.brightGreen[500],
                secondary: '#000',
            },
            hover: {
                default: c.grey[150],
                accent: c.grey[100],
            },
        },
        component: {
            main: '#000',
            accent: 'rgba(255,255,255,0.7)',
            contrast: '#fff',
        },
    },
    colors: c,
    gradients: lightGradients,
};

export default lightPalette;
