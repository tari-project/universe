import styled from 'styled-components';

export const MiningViewContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
`;

export const TappletContainer = styled.div`
    pointer-events: all;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 2;
`;

export const StyledIFrame = styled.iframe.attrs({
    title: 'Tari Bridge Tapplet',
    width: '100%',
    height: '100%',
    loading: 'lazy',
    referrerPolicy: 'strict-origin-when-cross-origin',
})`
    border: none;
    pointer-events: all;
`;
