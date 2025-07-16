import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Wrapper = styled.div`
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    border: 1px solid ${({ theme }) => theme.palette.divider};
    padding: 20px;
    display: flex;
    align-items: center;
    flex-direction: row;
    background-color: ${({ theme }) => theme.colorsAlpha.darkAlpha[10]};
    justify-content: space-between;
`;
export const TextWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    max-width: 80%;
`;

export const ProgressWrapper = styled.div`
    display: flex;
    gap: 10px;
    flex-direction: row;
    align-items: center;
`;

export const Title = styled(Typography).attrs({ variant: 'h6' })`
    font-size: 14px;
`;

export const Text = styled(Typography).attrs({ variant: 'p' })``;
