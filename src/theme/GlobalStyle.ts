import { createGlobalStyle } from 'styled-components';

export const GlobalReset = createGlobalStyle`
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
        &:focus {
            outline: none;
        }
    }
    textarea,
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

        &:focus {
            outline: none;
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
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        height: 100%;
        min-height: 100vh;
        min-width: 100vw;
        width: 100%;
        box-sizing: border-box;
        position: relative;

        ::-webkit-scrollbar {
            display: none;
        }

        -ms-overflow-style: none; /* IE and Edge */
        scrollbar-width: none; /* Firefox */
        letter-spacing: -0.02px;
        font-weight: 400;

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
        pointer-events: auto;
        width: 100vw;
    }

    #root {
        pointer-events: none;
    }

`;
