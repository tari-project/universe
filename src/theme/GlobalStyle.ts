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
    }
    input{
        all: unset;
        /* Chrome, Safari, Edge, Opera */
        &::-webkit-outer-spin-button,
        &::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }

        /* Firefox */
        &[type=number] {
            -moz-appearance: textfield;
        }
    }
`;
export const GlobalStyle = createGlobalStyle`
    @font-face {
        font-family: "AvenirRegular";
        src: url("/assets/fonts/AvenirLTStd-Book.otf") format("otf");
        font-display: fallback;
    }

    @font-face {
        font-family: "AvenirMedium";
        src: url("/assets/fonts/AvenirLTStd-Medium.otf") format("otf");
        font-display: fallback;
    }

    @font-face {
        font-family: "AvenirHeavy";
        src: url("/assets/fonts/AvenirLTStd-Heavy.otf") format("otf");
        font-display: fallback;
    }

    @font-face {
        font-family: "Poppins";
        font-weight: 200;
        font-style: normal;
        src:
                url("/assets/fonts/Poppins/Poppins-ExtraLight.woff2") format("woff2"),
                url("/assets/fonts/Poppins/Poppins-ExtraLight.woff") format("woff"),
                url("/assets/fonts/Poppins/Poppins-ExtraLight.ttf") format("truetype");
        font-display: fallback;
    }
    @font-face {
        font-family: "Poppins";
        font-weight: 300;
        font-style: normal;
        src:
                url("/assets/fonts/Poppins/Poppins-Light.woff2") format("woff2"),
                url("/assets/fonts/Poppins/Poppins-Light.woff") format("woff"),
                url("/assets/fonts/Poppins/Poppins-Light.ttf") format("truetype");
        font-display: fallback;
    }
    @font-face {
        font-family: "Poppins";
        font-weight: 400;
        font-style: normal;
        src:
                url("/assets/fonts/Poppins/Poppins-Regular.woff2") format("woff2"),
                url("/assets/fonts/Poppins/Poppins-Regular.woff") format("woff"),
                url("/assets/fonts/Poppins/Poppins-Regular.ttf") format("truetype");
        font-display: fallback;
    }
    @font-face {
        font-family: "Poppins";
        font-weight: 500;
        font-style: normal;
        src:
                url("/assets/fonts/Poppins/Poppins-Medium.woff2") format("woff2"),
                url("/assets/fonts/Poppins/Poppins-Medium.woff") format("woff"),
                url("/assets/fonts/Poppins/Poppins-Medium.ttf") format("truetype");
        font-display: fallback;
    }
    @font-face {
        font-family: "Poppins";
        font-weight: 600;
        font-style: normal;
        src:
                url("/assets/fonts/Poppins/Poppins-SemiBold.woff2") format("woff2"),
                url("/assets/fonts/Poppins/Poppins-SemiBold.woff") format("woff"),
                url("/assets/fonts/Poppins/Poppins-SemiBold.ttf") format("truetype");
        font-display: fallback;
    }
    @font-face {
        font-family: "Poppins";
        font-weight: 700;
        font-style: normal;
        src:
                url("/assets/fonts/Poppins/Poppins-Bold.woff2") format("woff2"),
                url("/assets/fonts/Poppins/Poppins-Bold.woff") format("woff"),
                url("/assets/fonts/Poppins/Poppins-Bold.ttf") format("truetype");
        font-display: fallback;
    }
    @font-face {
        font-family: "Poppins";
        font-weight: 800;
        font-style: normal;
        src:
                url("/assets/fonts/Poppins/Poppins-ExtraBold.woff2") format("woff2"),
                url("/assets/fonts/Poppins/Poppins-ExtraBold.woff") format("woff"),
                url("/assets/fonts/Poppins/Poppins-ExtraBold.ttf") format("truetype");
        font-display: fallback;
    }
    @font-face {
        font-family: "Poppins";
        font-weight: 900;
        font-style: normal;
        src:
                url("/assets/fonts/Poppins/Poppins-Black.woff2") format("woff2"),
                url("/assets/fonts/Poppins/Poppins-Black.woff") format("woff"),
                url("/assets/fonts/Poppins/Poppins-Black.ttf") format("truetype");
        font-display: fallback;
    }

    @font-face {
        font-family: "DrukWideLCGBold";
        src: url("/assets/fonts/Druk/DrukWideLCG-Bold.ttf") format("ttf");
        font-weight: 900;
        font-display: fallback;
    }

    html,
    main,
    body,
    #root {
        margin: 0;
        padding: 0;
        font-family: "PoppinsMedium", sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        border-radius: 12px;
        //overflow: hidden;
        height: 100%;
        min-height: 100vh;
        min-width: 100vw;
        width: 100%;
        box-sizing: border-box;
        position: relative;
        ::-webkit-scrollbar {
            display: none;
        }
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
        letter-spacing: -.02px;
        font-weight: 400;
        * {
            box-sizing: border-box;
            ::-webkit-scrollbar {
                display: none;
            }
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
        }
    }
`;
