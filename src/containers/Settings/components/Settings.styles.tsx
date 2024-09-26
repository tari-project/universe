import styled from 'styled-components';
import { Stack } from '@app/components/elements/Stack.tsx';
import { IoCheckmarkCircle } from 'react-icons/io5';

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
    background-color: ${({ theme }) => theme.palette.background.paper};
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    color: ${({ theme }) => theme.palette.text.secondary};
    box-shadow: 0 4px 45px 0 rgba(0, 0, 0, 0.08);
    font-size: 12px;
    font-weight: 500;
    gap: 8px;
`;

export const ConnectionIcon = styled(IoCheckmarkCircle)<{ $isConnected?: boolean }>(({ theme, $isConnected }) => ({
    color: $isConnected ? theme.palette.success.main : theme.palette.error.main,
}));
