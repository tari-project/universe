import styled from 'styled-components';
import { Stack } from '@app/components/elements/Stack.tsx';
import { LinearProgress } from '@app/components/elements/LinearProgress.tsx';

export const AutoMinerContainer = styled(Stack)<{ $percentage: number }>`
    background-color: ${({ theme }) => theme.palette.colors.backgrounds.medGrey};
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    padding: 10px 15px;
    gap: 10px;
`;

export const AutoMinerProgressBar = styled(LinearProgress)`
    background-color: #18875044;
    height: 4px;
`;
