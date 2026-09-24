import styled from 'styled-components';
import { Button } from '@app/components/elements/buttons/Button.tsx';

export const NavWrapper = styled.div`
    display: flex;
    justify-content: flex-end;
    flex-direction: row;
    position: relative;
    align-items: center;
    flex: 1 1 auto;
    min-width: 0;

    gap: 5px;
`;

export const NavButton = styled(Button).attrs({
    size: 'medium',
})<{ $isActive?: boolean }>`
    line-height: 1.05;
    font-size: 11px;

    color: ${({ theme }) => theme.palette.text.primary};
    background-color: ${({ theme }) =>
        theme.mode === 'light' ? theme.palette.background.paper : theme.palette.background.default};
    text-transform: capitalize;

    height: 22px;
    flex: 1 1 0;
    min-width: 0;
    max-width: 70px;
    padding: 0 6px;

    &:hover {
        background-color: ${({ theme }) =>
            theme.mode === 'light' ? theme.palette.background.accent : '#000'} !important;
    }

    &:disabled {
        opacity: 0.2;
        pointer-events: none;
    }
`;

export const BurnHint = styled.span`
    display: flex;
    flex: 1 1 0;
    min-width: 0;
    max-width: 70px;
`;
