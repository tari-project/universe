import styled from 'styled-components';
import { m } from 'framer-motion';
import { convertHexToRGBA } from '@app/utils/convertHex.ts';

export const Wrapper = styled(m.div)`
    overflow: hidden;
    top: 40px;
    width: 60vw;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    height: calc(100% - 100px);
    position: fixed;
    right: 10px;
`;

export const Column = styled(m.div)<{ $isNumber?: boolean }>`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
    position: relative;
    height: 100%;
`;

export const MarkGroup = styled(m.div)`
    display: flex;
`;

export const RulerMarkGroup = styled(m.div)`
    display: flex;
    position: relative;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 35px;
`;

export const RulerMark = styled(m.div)<{ $opacity?: number }>`
    width: 10px;
    display: flex;
    height: 100%;
    position: relative;
    font-weight: 700;
    color: ${({ theme }) => convertHexToRGBA(theme.palette.text.primary!, 0.2)};
    font-family: Poppins, sans-serif;
    font-variant-numeric: tabular-nums;
    text-align: right;
    font-size: 11px;

    &::before {
        top: 50%;
        content: attr(data-before);
        position: absolute;
        transform: translateY(-50%);
        right: 24px;
    }

    &:after {
        content: '';
        width: 10px;
        height: 1px;
        background-color: ${({ theme }) => theme.palette.text.primary};
        position: absolute;
        top: 50%;
        opacity: ${({ $opacity }) => $opacity || '0.2'};
        transform: translateY(-50%);
    }
`;
