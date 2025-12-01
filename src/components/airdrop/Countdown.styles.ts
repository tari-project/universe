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
export const CountdownContainer = styled.div`
    display: flex;
    flex: 1 1 10%;
    max-width: 110px;
`;

export const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(28px, 1fr));
    gap: 6px;
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
    font-size: 12px;
    flex: 1 0 auto;
    font-weight: 600;
    font-family: monospace;
    width: 100%;
    height: 100%;
    box-shadow: 0 0 7px 0 rgba(0, 0, 0, 0.13);
`;

export const CountdownText = styled(Typography).attrs({ variant: 'p' })`
    display: flex;
    font-size: 16px;
    line-height: 28px;
    font-weight: 500;
    opacity: 0.85;
    letter-spacing: -0.3px;
`;
