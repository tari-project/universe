import * as m from 'motion/react-m';
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
    background: rgba(0, 0, 0, 0.5);
    z-index: 0;
    cursor: pointer;
`;

export const BoxWrapper = styled(m.div)<{ $boxWidth?: number; $padding?: number }>`
    width: 100%;
    max-width: 481px;

    flex-shrink: 0;

    border-radius: 20px;
    background: rgba(255, 255, 255, 0.75);
    box-shadow: 0px 4px 74px 0px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(27px);

    position: relative;
    z-index: 1;

    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 30px;

    padding: 50px;
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
