import * as m from 'motion/react-m';
import styled from 'styled-components';
import { convertHexToRGBA } from '@app/utils';
import { Button } from '@app/components/elements/buttons/Button.tsx';

export const Wrapper = styled(m.div)`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    width: 100%;
`;

export const FilterWrapper = styled.div`
    display: flex;
    gap: 12px;
`;
export const FilterCTA = styled.button<{ $isActive?: boolean }>`
    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 11px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
    letter-spacing: -0.33px;
    text-transform: capitalize;
    transition: opacity.2s ease-in-out;
    border-radius: 10px;
    opacity: ${({ $isActive }) => ($isActive ? 1 : 0.5)};
    &:hover {
        opacity: 0.7;
    }
`;

export const SyncButton = styled.button`
    color: #fff;
    font-family: Poppins, sans-serif;
    font-size: 10px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
    letter-spacing: -0.44px;

    color: #fff;

    height: 25px;
    padding: 0 10px;
    border-radius: 100px;

    display: flex;
    align-items: center;
    gap: 6px;

    cursor: pointer;

    transition: all 0.2s ease-in-out;

    border: 1px solid rgba(221, 221, 221, 0.05);
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(77px);

    &:hover {
        background: rgba(255, 255, 255, 0.15);
    }
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
