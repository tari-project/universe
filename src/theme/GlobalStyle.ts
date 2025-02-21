import { createGlobalStyle } from 'styled-components';

export const GlobalReset = createGlobalStyle`
    *:focus {
        outline: none;
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
            outline: 3px solid #c9eb00;
            outline-offset: 2px;
        }
    }

    fieldset,
    textarea,
    dialog,
    input {
        all: unset;

        /* Chrome, Safari, Edge, Opera */
        &::-webkit-outer-spin-button,
        &::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }

        /* Firefox */
        &[type="number"] {
            -moz-appearance: textfield;
        }

        &:focus-visible {
            outline: 3px solid #c9eb00;
            outline-offset: 2px;
        }
    }
`;

export const GlobalStyle = createGlobalStyle`
    html,
    main,
    body,
    #root {
        margin: 0;
        padding: 0;
        font-family: Poppins, sans-serif;
        font-size: 16px;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        height: 100%;
        min-height: 100vh;
        min-width: 100vw;
        width: 100%;
        box-sizing: border-box;
        position: relative;
        transition:
                color 0.2s ease,
                background-color 0.2s ease,
                background 0.2s ease;

        ::-webkit-scrollbar {
            display: none;
        }

        -ms-overflow-style: none; /* IE and Edge */
        scrollbar-width: none; /* Firefox */
        letter-spacing: -0.02px;
        font-weight: 400;

        color: #000;
        @media (prefers-color-scheme: dark) {
            color: #fff;
        }
        
        * {
            box-sizing: border-box;

            ::-webkit-scrollbar {
                display: none;
            }

            -ms-overflow-style: none; /* IE and Edge */
            scrollbar-width: none; /* Firefox */
        }
    }

    #canvas {
        z-index: 0;
        top: 0;
        left: 0;
        pointer-events: auto;
        width: 100vw;
        background: none;
    }

    #root {
        z-index: 1;
        pointer-events: none;
    }

`;
