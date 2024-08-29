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

import { ThemeOptions } from '@mui/material/styles';
import { tariPurple, grey, success, info, warning, error, brightGreen } from './colors';

export const appBorderRadius = '0px'; // if this changes, please update the #canvas styling in index.html - can't import there

export const componentSettings: ThemeOptions = {
    shape: {
        borderRadius: 10,
    },
    spacing: 10,
    typography: {
        fontFamily: '"PoppinsMedium", sans-serif',
        fontSize: 14,
        body1: {
            fontSize: '14px',
            lineHeight: '20px',
        },
        body2: {
            fontSize: '12px',
            lineHeight: '18px',
        },
        h1: {
            fontSize: '30px',
            lineHeight: '42px',
            fontFamily: '"PoppinsSemiBold", sans-serif',
            letterSpacing: '-0.4px',
        },
        h2: {
            fontSize: '26px',
            lineHeight: '36px',
            fontFamily: '"PoppinsSemiBold", sans-serif',
            letterSpacing: '-1.2px',
        },
        h3: {
            fontSize: '24px',
            lineHeight: '32px',
            fontFamily: '"PoppinsSemiBold", sans-serif',
            letterSpacing: '-0.4px',
        },
        h4: {
            fontSize: '20px',
            lineHeight: '28px',
            fontFamily: '"PoppinsSemiBold", sans-serif',
            letterSpacing: '-1.6px',
        },
        h5: {
            fontSize: '16px',
            lineHeight: '26px',
            fontFamily: '"PoppinsMedium", sans-serif',
            letterSpacing: '-0.4px',
        },
        h6: {
            fontSize: '14px',
            lineHeight: '20px',
            fontFamily: '"PoppinsMedium", sans-serif',
            letterSpacing: '-0.4px',
        },
    },
    components: {
        MuiTypography: {
            defaultProps: {
                sx: {
                    color: (theme) => theme.palette.text.primary,
                    boxShadow: 'none',
                    '&.MuiTypography-body1': {
                        color: (theme) => theme.palette.text.secondary,
                    },
                    '&.MuiTypography-body2': {
                        color: (theme) => theme.palette.text.secondary,
                    },
                },
            },
        },
        MuiPaper: {
            defaultProps: {
                elevation: 0,
                sx: {
                    background: (theme) => theme.palette.background.paper,
                },
            },
        },
        MuiDivider: {
            defaultProps: {
                sx: {
                    borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                },
            },
        },
        MuiIconButton: {
            defaultProps: {
                sx: {
                    padding: 0.5,
                    boxShadow: 'none',
                    color: (theme) => theme.palette.text.primary,
                },
            },
        },
        MuiButton: {
            defaultProps: {
                size: 'medium',
                disableElevation: true,
                disableRipple: true,
                sx: {
                    textTransform: 'none',
                    letterSpacing: '-0.4px',
                },
            },
        },
        MuiDialog: {
            defaultProps: {
                sx: {
                    '& .MuiBackdrop-root': {
                        borderRadius: appBorderRadius,
                    },
                },
            },
        },
        MuiLinearProgress: {
            defaultProps: {
                sx: {
                    borderRadius: 10,
                    height: 10,
                    '& .MuiLinearProgress-bar': {
                        borderRadius: 10,
                    },
                },
            },
        },
        MuiSwitch: {
            defaultProps: {
                disableRipple: true,
                sx: {
                    width: '36px',
                    height: '20px',
                    padding: 0,
                    '& .MuiSwitch-switchBase': {
                        padding: 0,
                        margin: '2px',
                        transitionDuration: '300ms',
                        '&.Mui-checked': {
                            transform: 'translateX(16px)',
                            color: '#fff',
                            '& + .MuiSwitch-track': {
                                backgroundColor: (theme) => (theme.palette.mode === 'dark' ? '#2ECA45' : '#06C983'),
                                opacity: 1,
                                border: 0,
                            },
                            '&.Mui-disabled + .MuiSwitch-track': {
                                opacity: 0.5,
                            },
                        },
                        '&.Mui-focusVisible .MuiSwitch-thumb': {
                            color: '#33cf4d',
                            border: '6px solid #fff',
                        },
                        '&.Mui-disabled .MuiSwitch-thumb': {
                            color: (theme) =>
                                theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[600],
                        },
                        '&.Mui-disabled + .MuiSwitch-track': {
                            opacity: (theme) => (theme.palette.mode === 'light' ? 0.7 : 0.3),
                        },
                    },
                    '& .MuiSwitch-thumb': {
                        boxSizing: 'border-box',
                        width: '16px',
                        height: '16px',
                    },
                    '& .MuiSwitch-track': {
                        borderRadius: 20 / 2,
                        backgroundColor: 'black',
                        opacity: 1,
                        transition: (theme) =>
                            theme.transitions.create(['background-color'], {
                                duration: 500,
                            }),
                    },
                },
            },
        },
    },
};

export const light: ThemeOptions = {
    palette: {
        mode: 'light',
        primary: {
            main: tariPurple[600],
            dark: tariPurple[800],
            light: tariPurple[500],
        },
        secondary: {
            main: brightGreen[600],
            dark: brightGreen[700],
            light: brightGreen[500],
        },
        divider: 'rgba(0,0,0,0.06)',
        text: {
            primary: '#000000',
            secondary: '#797979',
            disabled: grey[400],
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
        },
        error: {
            main: error[200],
            dark: error[300],
            light: error[100],
            contrastText: error[300],
        },
        info: {
            main: info[200],
            dark: info[300],
            light: info[100],
            contrastText: info[300],
        },
    },
};

export const dark: ThemeOptions = {
    palette: {
        mode: 'dark',
        primary: {
            main: tariPurple[500],
            dark: tariPurple[200],
            light: tariPurple[50],
        },
        secondary: {
            main: brightGreen[500],
            dark: brightGreen[400],
            light: brightGreen[600],
        },
        divider: 'rgba(255,255,255,0.1)',
        text: {
            primary: '#FFFFFF',
            secondary: grey[300],
            disabled: 'rgba(255,255,255,0.4)',
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
        },
        error: {
            main: error[200],
            dark: error[100],
            light: error[300],
            contrastText: error[100],
        },
        info: {
            main: info[200],
            dark: info[100],
            light: info[300],
            contrastText: info[100],
        },
    },
};
