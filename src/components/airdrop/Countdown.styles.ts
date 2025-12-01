import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const CountdownWrapper = styled.div`
    display: flex;
    align-items: stretch;
    justify-content: center;
    gap: 8px;
    width: 100%;
    min-height: 30px;
    padding: 0 24px;
    flex-wrap: wrap;
`;
export const CountdownContainer = styled.div`
    display: flex;
    flex: 1 1 10%;
`;

export const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(30px, 1fr));
    gap: 8px;
    width: 100%;
    height: 100%;
`;

export const CountdownSquare = styled.div`
    line-height: 1;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #000000;
    font-size: 13px;
    flex: 1 0 0;
    font-weight: 600;
    font-family: monospace;
    width: 100%;
    height: 100%;
    box-shadow: 0 0 7px 0 rgba(0, 0, 0, 0.13);
`;

export const CountdownText = styled(Typography).attrs({ variant: 'p' })`
    display: flex;
    font-size: 16px;
    line-height: 30px;
    font-weight: 500;
    opacity: 0.8;
`;
