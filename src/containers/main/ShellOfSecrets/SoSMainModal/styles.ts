import { m } from 'framer-motion';
import styled, { css } from 'styled-components';

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

    padding: 40px;
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
`;

export const CloseButton = styled('button')`
    cursor: pointer;
    position: absolute;
    top: -20px;
    left: 100%;
    margin-left: 5px;
    transition: transform 0.2s ease;
    color: rgba(255, 255, 255, 0.5);
    transition:
        color 0.2s ease,
        transform 0.2s ease;

    &:hover {
        color: #fff;
        transform: scale(1.1);
    }
`;

export const ContentLayer = styled('div')`
    position: relative;
    z-index: 3;

    display: flex;
    gap: 40px;

    width: 100%;
    height: 100%;

    color: #fff;
`;
