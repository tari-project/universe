import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    padding: 0 10px;
    width: 580px;
    min-height: 200px;
`;
export const ChipText = styled(Typography).attrs({
    variant: 'h5',
})``;

export const Title = styled(Typography)`
    font-size: clamp(24px, 1.2rem + 1vh, 30px);
    line-height: 1.6;
`;

export const Description = styled(Typography)`
    color: ${({ theme }) => theme.palette.text.accent};
    font-size: clamp(13px, 0.4rem + 0.5vh, 16px);
    font-weight: 400;
`;
