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
import { darkGradients } from '@app/theme/gradients.ts';

const darkPalette: ThemePalette = {
    mode: 'dark',
    palette: {
        base: '#000',
        contrast: '#fff',
        contrastAlpha: c.lightAlpha[5],
        primary: {
            main: c.tariPurple[900],
            dark: c.tariPurple[950],
            light: c.tariPurple[400],
            shadow: c.tariPurpleAlpha[80],
            wisp: c.tariPurpleAlpha[5],
            contrast: '#FFFFFF',
        },
        secondary: {
            main: c.green[600],
            dark: c.green[700],
            light: c.green[500],
            wisp: c.tariPurpleAlpha[5],
        },
        divider: 'rgba(255,255,255,0.1)',
        text: {
            main: c.tariPurple[300],
            primary: '#FFFFFF',
            secondary: c.grey[300],
            disabled: 'rgba(255,255,255,0.4)',
            contrast: '#000000',
        },
        background: {
            default: c.grey[900],
            paper: c.grey[700],
            accent: c.grey[400],
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
            wisp: c.warningDarkAlpha[5],
        },
        error: {
            main: c.error[200],
            dark: c.error[300],
            light: c.error[300],
            contrast: c.error[100],
            wisp: c.errorDarkAlpha[5],
        },
        info: {
            main: c.info[200],
            dark: c.info[100],
            light: c.info[300],
            contrast: c.info[100],
        },
        action: {
            background: {
                default: c.grey[900],
                accent: c.grey[850],
            },
            hover: {
                default: c.grey[850],
                accent: c.grey[800],
            },
        },
    },
    colors: c,
    gradients: darkGradients,
};
export default darkPalette;
