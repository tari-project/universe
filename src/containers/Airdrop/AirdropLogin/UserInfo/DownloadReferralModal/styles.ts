import { motion } from 'framer-motion';
import styled, { css } from 'styled-components';

export const Overlay = styled('div')`
    z-index: 9999;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: all;
`;

export const BoxWrapper = styled(motion.div)`
    max-width: 560px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 15px;

    padding: 20px;

    border-radius: 10px;
    background: linear-gradient(180deg, #c9eb00 32.79%, #ffffff 69.42%);

    box-shadow: 0px 0px 25px 0px rgba(0, 0, 0, 0.05);
    width: 100%;

    margin-bottom: 20px;
`;

export const TextWrapper = styled('div')`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

export const Title = styled('div')`
    font-family:
        Druk LCG,
        sans-serif;
    color: #000;
    font-size: 28px;
    font-weight: bold;
    line-height: 110%;
    span {
        color: #ff4a55;
    }
`;

export const Text = styled('span')`
    color: #797979;
    font-size: 12px;
    font-weight: 500;
    line-height: 116.667%;
`;

export const ShareCode = styled('div')`
    font-size: 18px;
    font-weight: 600;
    background: black;
    color: #c9eb00;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px;
    border-radius: 10px;
    width: 100%;
    padding: 10px 14px 10px 36px;
`;

export const CopyButton = styled('button')<{ $copied?: boolean }>`
    color: black;
    width: 113px;
    height: 51px;
    border-radius: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    font-size: 14px;
    font-weight: 600;
    padding: 0 14px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    background: white;
    ${({ $copied }) =>
        $copied &&
        css`
            background: #c9eb00;
        `}
`;

export const GemImage = styled('img')`
    width: 25px;
`;
