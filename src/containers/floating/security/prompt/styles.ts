import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Wrapper = styled.div`
    display: flex;
    width: clamp(600px, 45vw, 710px);
    flex-direction: column;
    padding: 26px;
`;

export const Header = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: end;
`;

export const Content = styled.div`
    display: flex;
    gap: 20px;
    padding: 0 20px;
    flex-direction: column;
`;

export const Title = styled(Typography).attrs({ variant: 'h1' })`
    line-height: 1;
    white-space: pre-wrap;
`;

export const Subtitle = styled(Typography)`
    color: ${({ theme }) => theme.palette.text.secondary};
`;
