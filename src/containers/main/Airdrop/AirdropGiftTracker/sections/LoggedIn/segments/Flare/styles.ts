import * as m from 'motion/react-m';
import styled from 'styled-components';

export const Wrapper = styled(m.div)`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;

    display: flex;
    background-color: #000;
    z-index: 1;
    border-radius: 10px;
    overflow: hidden;

    cursor: pointer;
`;

export const Number = styled(m.div)`
    text-align: center;
    font-family: Druk, sans-serif;
    font-weight: 700;
    font-size: 68px;
    line-height: 1.1;
    position: relative;
    z-index: 2;
`;

export const Text = styled(m.div)`
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
    letter-spacing: -0.36px;

    text-align: center;

    position: relative;
    z-index: 2;
`;

export const TextBottomPosition = styled('div')`
    position: absolute;
    z-index: 2;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
`;

export const TextBottom = styled(m.div)`
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
    letter-spacing: -0.36px;

    text-align: center;
    z-index: 2;
`;
