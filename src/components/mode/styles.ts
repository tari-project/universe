import styled, { css } from 'styled-components';
import { DIALOG_Z_INDEX } from '@app/components/elements/dialog/Dialog.styles.ts';

export const Wrapper = styled.div`
    display: flex;
    flex: 1 1 auto;
    width: 100%;
`;
export const ListContainer = styled.div`
    display: flex;
    flex: 1 1 auto;
    min-width: max-content;
    width: 100%;
    z-index: ${DIALOG_Z_INDEX}; // same as dialog
    border-radius: 10px;
`;

export const Option = styled.button<{ $isSelected: boolean; $isActive?: boolean }>`
    border-radius: 10px;
    position: relative;
    min-width: max-content;
    color: ${({ theme }) => theme.palette.text.primary};
    font-family: Poppins, sans-serif;
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;

    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 6px;

    padding: 8px 7px;
    transition: background 0.1s cubic-bezier(0.39, 0.3, 0.2, 0.87);

    cursor: pointer;

    .selected-icon {
        display: flex;
        width: 30px;
    }

    background: ${({ theme, $isSelected }) => ($isSelected ? theme.palette.action.background.default : 'none')};

    &:hover {
        background: ${({ theme }) => theme.palette.action.hover.default};
    }

    &:focus {
        background: ${({ theme }) => theme.palette.action.hover.default};
        outline: 2px solid ${({ theme }) => theme.palette.focusOutline};
        outline-offset: -2px;
    }

    &:focus-visible {
        outline: 2px solid ${({ theme }) => theme.palette.focusOutline};
        outline-offset: -2px;
    }

    ${({ $isActive, theme }) =>
        $isActive &&
        css`
            background: ${theme.palette.action.hover.default};
        `}
`;
export const OptionText = styled.div`
    font-family: Poppins, sans-serif;
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
    width: 100%;
    display: flex;
`;
export const OptionIcon = styled.img`
    width: 18px;
    flex-shrink: 0;
    display: flex;
`;
