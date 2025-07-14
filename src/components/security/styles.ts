import styled from 'styled-components';
import { Button } from '@app/components/elements/buttons/Button.tsx';

export const CTA = styled(Button).attrs({
    fluid: true,
})`
    font-weight: 600;
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
