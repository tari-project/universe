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

const lightAlpha = {
    5: 'rgba(255,255,255,0.05)',
    10: 'rgba(255,255,255,0.1)',
    20: 'rgba(255,255,255,0.2)',
    30: 'rgba(255,255,255,0.3)',
    40: 'rgba(255,255,255,0.4)',
    50: 'rgba(255,255,255,0.5)',
    60: 'rgba(255,255,255,0.6)',
    70: 'rgba(255,255,255,0.7)',
    80: 'rgba(255,255,255,0.8)',
    90: 'rgba(255,255,255,0.9)',
};

const darkAlpha = {
    5: 'rgba(0,0,0,0.05)',
    10: 'rgba(0,0,0,0.1)',
    20: 'rgba(0,0,0,0.2)',
    30: 'rgba(0,0,0,0.3)',
    40: 'rgba(0,0,0,0.4)',
    50: 'rgba(0,0,0,0.5)',
    60: 'rgba(0,0,0,0.6)',
    70: 'rgba(0,0,0,0.7)',
    80: 'rgba(0,0,0,0.8)',
    90: 'rgba(0,0,0,0.9)',
};

const tariPurpleAlpha = {
    5: 'rgba(147,48,255,0.05)',
    10: 'rgba(147,48,255,0.1)',
    20: 'rgba(147,48,255,0.2)',
    30: 'rgba(147,48,255,0.3)',
    40: 'rgba(147,48,255,0.4)',
    50: 'rgba(147,48,255,0.5)',
    60: 'rgba(147,48,255,0.6)',
    70: 'rgba(147,48,255,0.7)',
    80: 'rgba(147,48,255,0.8)',
    90: 'rgba(147,48,255,0.9)',
};
const warningDarkAlpha = {
    5: 'rgba(209,138,24,0.05)',
    10: 'rgba(209,138,24,0.1)',
    20: 'rgba(209,138,24,0.2)',
    30: 'rgba(209,138,24,0.3)',
    40: 'rgba(209,138,24,0.4)',
    50: 'rgba(209,138,24,0.5)',
    60: 'rgba(209,138,24,0.6)',
    70: 'rgba(209,138,24,0.7)',
    80: 'rgba(209,138,24,0.8)',
    90: 'rgba(209,138,24,0.9)',
};

const errorDarkAlpha = {
    5: 'rgba(97,40,32,0.05)',
    10: 'rgba(97,40,32,0.1)',
    20: 'rgba(97,40,32,0.2)',
    30: 'rgba(97,40,32,0.3)',
    40: 'rgba(97,40,32,0.4)',
    50: 'rgba(97,40,32,0.5)',
    60: 'rgba(97,40,32,0.6)',
    70: 'rgba(97,40,32,0.7)',
    80: 'rgba(97,40,32,0.8)',
    90: 'rgba(97,40,32,0.9)',
};

const greyscaleAlpha = {
    5: 'rgba(255, 255, 255, 0.5)',
    10: 'rgba(228, 228, 228, 0.5)',
    15: 'rgba(202, 202, 202, 0.5)',
    20: 'rgba(175, 175, 175, 0.5)',
    30: 'rgba(149, 149, 149, 0.5)',
    40: 'rgba(122, 122, 122, 0.5)',
    50: 'rgba(96, 96, 96, 0.5)',
    60: 'rgba(69, 69, 69, 0.5)',
    70: 'rgba(43, 43, 43, 0.5)',
    80: 'rgba(17, 17, 17, 0.5)',
    90: 'rgba(8, 8, 8, 0.5)',
    95: 'rgba(0, 0, 0, 0.5)',
};

export const colorsAlpha = {
    lightAlpha,
    darkAlpha,
    tariPurpleAlpha,
    warningDarkAlpha,
    errorDarkAlpha,
    greyscaleAlpha,
};

export type ColoursAlpha = typeof colorsAlpha;
