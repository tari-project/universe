import { m } from 'framer-motion';
import styled from 'styled-components';

export const Wrapper = styled('div')`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0;
    position: relative;
    z-index: 1;
`;

export const Number = styled('div')`
    display: flex;
    align-items: center;
    gap: 2px;

    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 18px;
    font-weight: 600;
    line-height: 100%;

    font-variant-numeric: tabular-nums;

    span {
        display: inline-block;
    }

    .digit-num {
        width: 9px;
        text-align: right;
    }

    .digit-char {
        width: 3px;
        text-align: right;
    }
`;

export const Label = styled('div')`
    color: ${({ theme }) => theme.palette.text.secondary};
    font-size: 12px;
    font-weight: 500;
    line-height: 100%;
`;

export const GemImage = styled('img')`
    position: relative;
    z-index: 1;
    width: 20px;
`;

export const GemsAnimation = styled(m.div)`
    position: absolute;
    top: 1px;
    left: 1px;
    z-index: 0;
`;

export const GemAnimatedImage = styled(m.img)`
    position: absolute;
    top: 0;
    left: 0;
    width: 20px;
`;
