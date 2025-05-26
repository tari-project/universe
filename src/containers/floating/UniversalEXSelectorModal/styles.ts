import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    height: min(400px, 80vh);
    width: max(200px, 40vw);
`;

export const EXMinerList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 24px;
    border-radius: 24px;
    background-color: ${({ theme }) => theme.palette.background.paper};
    width: 100%;
    padding: 20px;
`;

export const EXMiner = styled.div`
    cursor: pointer;
    padding: 14px 20px;
    border-radius: 16px;
    background: ${({ theme }) => theme.palette.background.paper};
    color: ${({ theme }) => theme.palette.text.primary};
    font-weight: 600;
    transition:
        background 0.15s,
        border 0.15s;
    text-align: left;
`;

export const HeaderSection = styled.div`
    display: flex;
    padding: 30px 30px 20px;
`;
export const Heading = styled(Typography).attrs({ variant: 'h4' })`
    line-height: 1.2;
    letter-spacing: -1px;
`;
