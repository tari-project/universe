import * as m from 'motion/react-m';
import styled from 'styled-components';
import { SB_SPACING } from '@app/theme/styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Wrapper = styled(m.div)`
    border-radius: 10px;
    background: ${({ theme }) => theme.palette.background.default};
    box-shadow: 0 4px 45px 0 rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    max-width: 320px;
    padding: 20px;
    align-items: center;
    gap: 20px;
    flex-shrink: 0;
    z-index: 10;
    bottom: 40px;
    position: fixed;
    margin: 0 0 0 ${SB_SPACING / 2}px;
`;

export const Title = styled(Typography).attrs({ variant: 'h2' })`
    font-weight: 700;
    font-size: 16px;
    text-align: center;
`;

export const BodyCopy = styled(Typography).attrs({ variant: 'p' })`
    text-align: center;
`;

export const ChevronWrapper = styled.div`
    transform: rotate(-90deg);
`;

export const CTAWrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    align-items: center;
    font-weight: 600;
`;
