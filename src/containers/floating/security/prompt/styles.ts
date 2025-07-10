import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';

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

export const CTAWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    font-weight: 600;
`;
export const CTA = styled(Button).attrs({
    size: 'xlarge',
    fluid: true,
})`
    background-color: ${({ theme }) => theme.palette.contrast};
    color: ${({ theme }) => theme.palette.text.contrast};
    transform: scale(0.99);
    &:hover:not(:disabled) {
        background-color: ${({ theme }) => theme.palette.contrast};
        color: ${({ theme }) => theme.palette.text.contrast};
        transform: scale(1);
        opacity: 0.9;
    }
`;
