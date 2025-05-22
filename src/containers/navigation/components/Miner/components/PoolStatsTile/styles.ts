import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Wrapper = styled.div`
    height: 60px;
    padding: 0 15px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 -4px 10px -5px rgba(24, 135, 80, 0.05);
    background: linear-gradient(99deg, rgba(24, 135, 80, 0.3) -50%, transparent 8%, rgba(24, 135, 80, 0.3) 190%);
    color: ${({ theme }) => theme.palette.text.accent};
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    font-size: 12px;
    font-weight: 500;
    flex-shrink: 0;
    flex-grow: 6;
`;

export const LeftContent = styled.div`
    display: flex;
    flex-direction: column;
`;
export const RightContent = styled.div`
    display: flex;
    flex-direction: column;
`;

export const Values = styled.div`
    display: flex;
    align-items: baseline;
`;

export const Title = styled(Typography).attrs({ variant: 'h6' })`
    font-size: 12px;
`;

export const BalanceVal = styled(Typography)`
    font-size: 18px;
    color: ${({ theme }) => theme.palette.text.primary};
    vertical-align: bottom;
    letter-spacing: -0.4px;
`;

export const MinPayoutVal = styled(Typography)`
    font-size: 10px;
    letter-spacing: -0.4px;
    vertical-align: bottom;
`;
