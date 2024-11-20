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

import { colorsAlpha } from './colorsAlpha.ts';

const success = {
    50: '#E6FAF6',
    100: '#a1d2c1',
    200: '#06C983',
    300: '#15D811',
    400: '#8DB5AD',
    500: '#77A49B',
    600: '#619289',
    700: '#4B8177',
    800: '#357065',
    900: '#1F5F53',
    950: '#094E41',
};

const info = {
    50: '#ECF0FE',
    100: '#C4CFF8',
    200: '#9CAFF3',
    300: '#748FED',
    400: '#4D6FE8',
    500: '#4060D1',
    600: '#3452BA',
    700: '#2843A3',
    800: '#1C358C',
    900: '#102675',
    950: '#04185F',
};

const warning = {
    50: '#FFEED3',
    100: '#F3D5A4',
    200: '#E8BC75',
    300: '#DCA346',
    400: '#D18A18',
    500: '#C88314',
    600: '#BF7D11',
    700: '#B7760D',
    800: '#AE700A',
    900: '#A56906',
    950: '#9D6303',
};

const error = {
    50: '#F9E5E2',
    100: '#F0C0B9',
    200: '#E89B91',
    300: '#E07668',
    400: '#D85240',
    500: '#C44B3A',
    600: '#B04435',
    700: '#9C3D30',
    800: '#88362A',
    900: '#742F25',
    950: '#612820',
};

const brightGreen = {
    50: '#ffffe4',
    100: '#fdffc5',
    200: '#f7ff92',
    300: '#eeff53',
    400: '#dffb20',
    500: '#C9EB00',
    600: '#95b500',
    700: '#718902',
    800: '#596c08',
    900: '#4b5b0c',
    950: '#273300',
};

const grey = {
    50: '#fafafa',
    100: '#f3f3f3',
    150: '#f5f5f5',
    200: '#d8d9df',
    300: '#b6b7c3',
    400: '#8f91a1',
    500: '#717286',
    600: '#4a4a5a',
    700: '#2E2E2E',
    800: '#212121',
    900: '#1B1B1B',
    950: '#0c0c0e',
};

const tariPurple = {
    50: '#F9F4FF',
    100: '#F2E5FF',
    200: '#E7D0FF',
    300: '#D4ACFF',
    400: '#BA76FF',
    500: '#9F42FF',
    600: '#9330FF',
    700: '#750EE2',
    800: '#6412B7',
    900: '#4E257A',
    950: '#311951',
};

const teal = {
    50: '#F1FAF9',
    100: '#DBF2F1',
    200: '#BBE6E5',
    300: '#88D3D3',
    400: '#55B9BB',
    500: '#3A9DA0',
    600: '#338187',
    700: '#2F686F',
    800: '#2D575D',
    900: '#294A50',
    950: '#172F35',
};

const gothic = {
    50: '#F3F8F8',
    100: '#E0EBED',
    200: '#C5D8DC',
    300: '#9CBCC4',
    400: '#63929E',
    500: '#517D89',
    600: '#466874',
    700: '#3D5661',
    800: '#384A52',
    900: '#324047',
    950: '#1E292E',
};

const blue = {
    50: '#EFF7FF',
    100: '#DAEDFF',
    200: '#BEE0FF',
    300: '#91CEFF',
    400: '#5DB2FD',
    500: '#318EFA',
    600: '#2172EF',
    700: '#195CDC',
    800: '#1B4BB2',
    900: '#1C428C',
    950: '#16336c',
};

const orange = {
    50: '#FDF7EF',
    100: '#FBEBD9',
    200: '#F5D4B3',
    300: '#ECA86A',
    400: '#E88F4F',
    500: '#E2712D',
    600: '#D35923',
    700: '#bd4b24',
    800: '#AF441F',
    900: '#8C3720',
    950: '#712F1D',
};

const green = {
    50: '#EEFBF3',
    100: '#D6F5E1',
    200: '#B0EAC7',
    300: '#7CD9A7',
    400: '#47C083',
    500: '#229B62',
    600: '#168552',
    700: '#126A45',
    800: '#115438',
    900: '#0F452F',
    950: '#07271B',
};

const red = {
    50: '#FEF3F2',
    100: '#FEE4E2',
    200: '#FECECA',
    300: '#FCACA5',
    400: '#F87C71',
    500: '#EF5244',
    600: '#DC3526',
    700: '#B9291C',
    800: '#A2281D',
    900: '#7F251D',
    950: '#450F0A',
};

const brightRed = {
    50: '#FEF3F2',
    100: '#ffd3d3',
    200: '#ffa8a8',
    300: '#fe7c7c',
    400: '#fe5050',
    500: '#fe2727',
    600: '#e70101',
    700: '#ae0101',
    800: '#740101',
    900: '#450F0A',
    950: '#3a0000',
};

const ramp = {
    1: '#1CCF31',
    2: '#50CC27',
    3: '#84C91E',
    4: '#B8C614',
    5: '#ECC30B',
    6: '#F2A607',
    7: '#F88903',
    8: '#FF6C00',
    9: '#FF4F00',
    10: '#FF3300',
};

export const colors = {
    blue,
    orange,
    green,
    red,
    brightRed,
    teal,
    gothic,
    tariPurple,
    grey,
    success,
    info,
    warning,
    error,
    brightGreen,
};

export const colorsAll = {
    ...colorsAlpha,
    ...colors,
    ramp,
};

export type Colours = typeof colors;
export type ThemeColourGroup = keyof Colours;
