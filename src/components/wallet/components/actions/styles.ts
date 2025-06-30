import * as m from 'motion/react-m';
import styled from 'styled-components';
import { Button } from '@app/components/elements/buttons/Button.tsx';

export const Wrapper = styled(m.div)`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    width: 100%;
`;

export const NavWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    flex-direction: row;
    position: relative;
    align-items: center;
    width: 100%;
    gap: 10px;
`;

export const NavButton = styled(Button).attrs({
    size: 'medium',
})<{ $isActive?: boolean }>`
    line-height: 1.05;
    font-size: 11px;
    width: 100%;
    color: ${({ theme }) => theme.palette.text.primary};
    background-color: ${({ theme }) => theme.palette.base};
    text-transform: capitalize;
    height: 35px;
    &:hover {
        opacity: 0.85;
    }

    &:disabled {
        opacity: 0.2;
        pointer-events: none;
    }
`;
