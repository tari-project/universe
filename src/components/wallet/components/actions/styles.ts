import styled from 'styled-components';
import { Button } from '@app/components/elements/buttons/Button.tsx';

export const NavWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    flex-direction: row;
    position: relative;
    align-items: center;

    gap: 5px;
`;

export const NavButton = styled(Button).attrs({
    size: 'medium',
})<{ $isActive?: boolean }>`
    line-height: 1.05;
    font-size: 11px;

    color: ${({ theme }) => theme.palette.text.primary};
    background-color: ${({ theme }) => theme.palette.base};
    text-transform: capitalize;

    height: 22px;
    width: 70px;

    &:hover {
        opacity: 0.85;
    }

    &:disabled {
        opacity: 0.2;
        pointer-events: none;
    }
`;
