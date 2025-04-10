import styled from 'styled-components';
import { convertHexToRGBA } from '@app/utils';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Card = styled.div`
    display: flex;
    padding: 30px;
    flex-direction: column;
    align-items: flex-start;
    justify-content: stretch;
    border-radius: 20px;
    background: ${({ theme }) => theme.palette.background.main};
    box-shadow: ${({ theme }) => `1px 1px 15px -5px ${convertHexToRGBA(theme.palette.contrast, 0.07)}`};
    gap: 10px;
    flex: 1;
`;

export const CardTitle = styled(Typography).attrs({ variant: 'h1' })`
    font-size: 21px;
    color: ${({ theme }) => theme.palette.text.default};
    font-weight: 700;
`;
export const CardSubtitle = styled(Typography)`
    font-size: 13px;
    font-weight: 500;
`;
export const CardActionWrapper = styled.div`
    display: flex;
    flex: 1;
    align-items: flex-end;
    width: max(240px, 70%);
`;

export const ActionWrapper = styled.div`
    color: ${({ theme }) => theme.palette.text.primary};
    background-color: ${({ theme }) => theme.palette.background.paper};
    border-radius: ${({ theme }) => theme.shape.borderRadius.buttonBase};
    padding: 0 5px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: stretch;
    width: 100%;
    font-size: 13px;
    font-weight: 700;
    text-align: center;
`;
