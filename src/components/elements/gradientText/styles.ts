import styled, { keyframes } from 'styled-components';

export const AnimatedGradientText = styled.div`
    position: relative;
    display: flex;
    max-width: fit-content;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    transition: box-shadow 0.5s ease-out;
    overflow: hidden;
    cursor: pointer;
`;

const gradient = keyframes`
    0% {
        background-position: 0% 50%;
}

    50% {
        background-position: 100% 50%;
}

    100% {
        background-position: 0% 50%;
}
`;

export const TextContent = styled.div`
    display: inline-block;
    position: relative;
    z-index: 2;
    background-size: 300% 100%;
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    animation: ${gradient} linear infinite;
`;
