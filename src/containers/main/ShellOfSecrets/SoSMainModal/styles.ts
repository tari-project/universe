import { m } from 'framer-motion';
import styled from 'styled-components';

export const Wrapper = styled('div')`
    position: fixed;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: 99999;

    display: flex;
    justify-content: center;
    align-items: center;

    pointer-events: all;

    overflow: hidden;
    overflow-y: auto;

    padding: 41px 64px;

    @media (max-width: 1400px) {
        padding: 30px;
    }
`;

export const Cover = styled(m.div)`
    position: fixed;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    background-color: rgba(0, 0, 0, 0.8);
    z-index: 0;
    cursor: pointer;

    backdrop-filter: blur(6px);
`;

export const BoxWrapper = styled(m.div)`
    width: 100%;
    height: 100%;
    flex-shrink: 0;

    border-radius: 30px;
    box-shadow: 0px 4px 50px 0px rgba(0, 0, 0, 0.5);

    background-color: #111212;

    position: relative;
    z-index: 1;
`;

export const BoxContent = styled('div')`
    display: flex;
    flex-direction: column;
    gap: 20px;

    padding: 34px;

    width: 100%;
    height: 100%;

    overflow: hidden;
    border-radius: 30px;
    position: relative;

    overflow: hidden;
    overflow-y: auto;
`;

export const CloseButton = styled('button')`
    cursor: pointer;
    position: absolute;
    top: -20px;
    right: -20px;
    z-index: 4;
    transition: transform 0.2s ease;
    color: #fff;

    display: flex;
    justify-content: center;
    align-items: center;

    width: 49px;
    height: 49px;
    border-radius: 50%;

    background-color: #36373a;

    &:hover {
        transform: scale(1.1);
    }
`;

export const ContentLayer = styled('div')`
    position: relative;
    z-index: 3;

    display: grid;
    grid-template-columns: 532px 1fr;
    gap: 40px;

    width: 100%;
    height: 100%;

    color: #e6ff47;
    font-family: 'IBM Plex Mono', sans-serif;
    font-weight: 700;

    transition: grid-template-columns 0.3s ease;

    @media (max-width: 1580px) {
        grid-template-columns: 400px 1fr;
    }

    @media (max-width: 1200px) {
        grid-template-columns: 350px 1fr;
    }
`;
