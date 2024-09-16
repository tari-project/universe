import styled from 'styled-components';
import { motion } from 'framer-motion';

export const Wrapper = styled(motion.div)`
    overflow: hidden;
    top: 40px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    pointer-events: none;
    height: calc(100% - 100px);
    position: fixed;
    right: 10px;
`;

export const Column = styled(motion.div)<{ $isNumber?: boolean }>`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
    position: relative;
    height: 100%;
`;

export const MarkGroup = styled(motion.div)`
    display: flex;
`;

export const RulerMarkGroup = styled(motion.div)`
    display: flex;
    position: relative;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 35px;
`;

export const RulerMark = styled(motion.div)<{ $opacity?: number }>`
    width: 10px;
    display: flex;
    height: 100%;
    position: relative;
    font-weight: 700;
    color: ${({ theme }) => theme.palette.colors.darkAlpha[20]};
    font-family: Poppins, sans-serif;
    font-variant-numeric: tabular-nums;
    text-align: right;
    font-size: 11px;

    &::before {
        top: 50%;
        content: attr(data-before);
        position: absolute;
        transform: translateY(-50%);
        right: 15px;
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
