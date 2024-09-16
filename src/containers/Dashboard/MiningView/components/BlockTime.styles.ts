import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';
import { motion } from 'framer-motion';

export const BlockTimeContainer = styled(motion.div)`
    display: flex;
    flex-direction: column;
    font-weight: 500;
    position: relative;
    align-items: flex-end;
`;

export const TitleTypography = styled(Typography)`
    font-size: 13px;
    color: ${({ theme }) => theme.palette.text.secondary};
`;

export const TimerWrapper = styled.div`
    box-shadow: 80px -20px 60px 20px rgba(255, 255, 255, 0.6);
`;
export const TimerTypography = styled.div`
    font-family: Druk, sans-serif;
    font-variant-numeric: tabular-nums;
    font-size: 18px;
    font-weight: 700;
    color: ${({ theme }) => theme.palette.text.primary};
    gap: 2px;
    display: flex;
    text-transform: uppercase;
`;

export const SpacedNum = styled('span')`
    font-variant-numeric: tabular-nums;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1ch;
`;
