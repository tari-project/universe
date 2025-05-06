import styled from 'styled-components';
import { IoCheckmarkCircle } from 'react-icons/io5';
import { convertHexToRGBA } from '@app/utils/convertHex.ts';
import { Typography } from '@app/components/elements/Typography.tsx';

export const CardContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    grid-auto-flow: row;
    gap: 10px;
`;

export const CardItem = styled.div`
    padding: 10px;
    display: flex;
    align-items: flex-start;
    flex-direction: column;
    justify-content: flex-start;
    background-color: ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.03)};
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    color: ${({ theme }) => theme.palette.text.secondary};
    font-size: 12px;
    font-weight: 500;
    gap: 3px;
`;

export const CardItemTitle = styled(Typography).attrs({
    variant: 'h6',
})`
    color: ${({ theme }) => theme.palette.text.primary};
    line-height: 14px;
    margin-bottom: 4px;
`;

export const CardItemLabelWrapper = styled.div`
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 4px;
`;
export const CardItemLabel = styled(Typography)``;
export const CardItemLabelValue = styled(Typography)`
    color: ${({ theme }) => theme.palette.text.primary};
    word-break: break-all;
`;

export const ConnectionIcon = styled(IoCheckmarkCircle)<{ $isConnected?: boolean }>(({ theme, $isConnected }) => ({
    color: $isConnected ? theme.palette.success.main : theme.palette.error.main,
}));
