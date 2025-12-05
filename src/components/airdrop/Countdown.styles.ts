import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const CountdownWrapper = styled.div`
    display: flex;
    align-items: stretch;
    justify-content: center;
    align-self: center;
    gap: 6px;
    width: 100%;
    min-height: 28px;
    flex-wrap: wrap;
    padding: 0 10px;
`;
export const CountdownText = styled(Typography).attrs({ variant: 'p' })`
    display: flex;
    opacity: 0.75;
    letter-spacing: -0.3px;
    text-align: center;
    font-size: 15px;
    font-style: normal;
    font-weight: 400;
    line-height: 1.22;

    strong {
        font-weight: 600;
    }
`;
