import { createGlobalStyle } from 'styled-components';
import { TOWER_CANVAS_ID } from '@app/store/types/ui.ts';

export const GlobalStyle = createGlobalStyle<{ $hideCanvas?: boolean }>`
    html,
    body,
    main,
    #root {
        margin: 0;
        padding: 0;
        min-height: 100vh;
        min-width: 100vw;
        height: 100%;
        width: 100%;

        font-family: Poppins, sans-serif;
        font-size: 16px;

        color: ${({ theme }) => theme.palette.text.primary};
        background: ${({ theme }) => theme.palette.background.main};
        box-sizing: border-box;
        position: relative;
        overflow: hidden;
        scrollbar-width: none;
        letter-spacing: -0.02px;
        font-weight: 400;
        transition:
                color 0.2s ease,
                background-color 0.2s ease,
                background 0.2s ease;

        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        -ms-overflow-style: none;

        ::-webkit-scrollbar {
            display: none;
        }

        *:focus {
            outline: none;
        }

        fieldset,
        textarea,
        dialog,
        input {
            all: unset;
            &::-webkit-outer-spin-button,
            &::-webkit-inner-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }
            &[type="number"] {
                -moz-appearance: textfield;
            }
            &:focus-visible {
                outline: 2px solid ${({ theme }) => theme.palette.focusOutline};
                outline-offset: 2px;
                transition: none;
            }
        }
        button {
            -webkit-appearance: none;
            border-radius: 0;
            text-align: inherit;
            background: none;
            box-shadow: none;
            padding: 0;
            cursor: pointer;
            border: none;
            color: inherit;
            font: inherit;
            
            &:focus-visible {
                outline: 2px solid ${({ theme }) => theme.palette.focusOutline};
                outline-offset: 2px;
                transition: none;
            }

        }
    }
    
    #${TOWER_CANVAS_ID} {
        z-index: 0;
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: auto;
        width: 100vw;
        background: none;
        transition: visibility 0.1s ease;
        visibility: ${({ $hideCanvas }) => (!$hideCanvas ? 'visible' : 'hidden')};
    }
`;
