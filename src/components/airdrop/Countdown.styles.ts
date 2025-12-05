import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const CountdownWrapper = styled.div`
    display: flex;
    align-items: stretch;
    justify-content: center;
    align-self: center;
    gap: 3px;
    width: 100%;
    flex-wrap: wrap;
`;
export const CountdownText = styled(Typography).attrs({ variant: 'p' })`
    display: flex;
    opacity: 0.75;
    letter-spacing: -0.3px;
    text-align: center;
    font-size: 15px;
    font-style: normal;
    font-weight: 400;
    line-height: 1;

    strong {
        font-weight: 600;
    }
`;
