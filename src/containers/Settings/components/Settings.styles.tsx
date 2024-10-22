import styled from 'styled-components';
import { Stack } from '@app/components/elements/Stack.tsx';
import { IoCheckmarkCircle } from 'react-icons/io5';
import { convertHexToRGBA } from '@app/utils/convertHex.ts';

export const CardContainer = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
`;

export const CardItem = styled(Stack)`
    padding: 10px;
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    background-color: ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.03)};
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    color: ${({ theme }) => theme.palette.text.secondary};
    font-size: 12px;
    font-weight: 500;
    gap: 8px;
`;

export const ConnectionIcon = styled(IoCheckmarkCircle)<{ $isConnected?: boolean }>(({ theme, $isConnected }) => ({
    color: $isConnected ? theme.palette.success.main : theme.palette.error.main,
}));
