import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 570px;
    gap: min(0.75vh, 20px);
    padding: min(10px, 2vh) 20px;
`;
export const ChipText = styled(Typography).attrs({
    variant: 'h5',
})`
    font-size: clamp(11px, 1.4vh, 16px);
    line-height: 1.1;
`;

export const Title = styled(Typography)`
    font-size: clamp(24px, 3vh, 30px);
    line-height: 1.6;
`;

export const Description = styled(Typography)`
    color: ${({ theme }) => theme.palette.text.accent};
    font-size: clamp(12px, 0.4rem + 0.5vh, 16px);
    line-height: 1.02;
    font-weight: 400;
`;
