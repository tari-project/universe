import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Wrapper = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

export const TextWrapper = styled.div`
    display: flex;
    gap: 0px;
    flex-direction: column;
`;

export const CountdownText = styled(Typography)`
    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 10px;
    font-weight: 600;
    line-height: normal;
    font-variant-numeric: tabular-nums;
`;
export const Label = styled(Typography)`
    color: ${({ theme }) => theme.palette.text.secondary};
    font-size: 10px;
    font-weight: 400;
    line-height: normal;
`;
