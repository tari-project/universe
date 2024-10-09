import { m } from 'framer-motion';
import styled from 'styled-components';

export const Wrapper = styled('div')`
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
`;

export const InviteButton = styled('button')`
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;

    height: 50px;
    padding: 12px 14px 12px 13px;

    border-radius: 60px;
    background: #000;

    transition: transform 0.2s ease;
    overflow: hidden;

    svg {
        flex-shrink: 0;
    }

    &:hover {
        transform: scale(1.05);
    }

    &:disabled {
        pointer-events: none;
    }
`;

export const TextWrapper = styled('div')`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
`;

export const Image = styled('img')``;

export const Title = styled('div')`
    color: #fff;
    text-align: center;
    font-size: 12px;
    font-weight: 600;
`;

export const Text = styled('div')`
    color: rgba(255, 255, 255, 0.5);
    text-align: center;
    font-size: 11px;
    font-weight: 600;

    span {
        color: #fff;
    }
`;

export const GemPill = styled('div')`
    display: flex;
    height: 27px;
    padding: 8px 10px 8px 16px;
    justify-content: center;
    align-items: center;
    gap: 2px;

    border-radius: 100px;
    background: linear-gradient(0deg, #c9eb00 0%, #c9eb00 100%), linear-gradient(180deg, #755cff 0%, #2946d9 100%),
        linear-gradient(180deg, #ff84a4 0%, #d92958 100%);

    color: #000;
    text-align: center;
    font-size: 12px;
    font-weight: 600;
`;

export const BonusWrapper = styled('div')`
    position: relative;

    .giftImage {
        position: absolute;
        top: -5px;
        right: -15px;
    }
`;

export const BonusText = styled('div')`
    display: flex;
    align-items: center;

    height: 30px;
    padding-left: 12px;

    border-radius: 100px;
    background: #f0f0f0;

    color: rgba(0, 0, 0, 0.5);
    font-size: 11px;
    font-weight: 500;

    strong {
        color: #000;
        font-weight: 600;
        display: inline;
        margin: 0 3px;
    }
`;

export const Copied = styled(m.div)`
    position: absolute;
    top: 0;
    right: 0;
    width: 100%;
    height: 100%;

    background: #c9eb00;

    color: #000;
    text-align: center;
    font-size: 12px;
    font-weight: 600;

    display: flex;
    align-items: center;
    justify-content: center;
`;
