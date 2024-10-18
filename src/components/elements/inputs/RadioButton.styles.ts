import styled, { css } from 'styled-components';
import { themeType } from '@app/store/types.ts';

interface Props {
    $variant: themeType;
    $disabled?: boolean;
}

export const RadioButtonWrapper = styled.div<Props>`
    display: flex;
    gap: 6px;
    align-items: center;
    justify-content: stretch;
    border-radius: 10px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    background: rgba(0, 0, 0, 0.1);
    height: 55px;
    padding: 17px 25px;
    width: 100%;
`;

export const StyledLabel = styled.label<Props>`
    color: ${({ theme }) => theme.palette.text.primary};
    cursor: default;
    text-transform: capitalize;
    text-align: center;
    width: 100%;
    ${({ $disabled }) =>
        $disabled &&
        css`
            color: ${({ theme }) => theme.palette.text.disabled};
            cursor: not-allowed;
        `}
`;

export const StyledRadio = styled.input<Props>`
    appearance: none;
    margin: 0;
    width: 20px;
    height: 20px;
    border: 2px solid ${({ theme }) => theme.palette.primary.dark};
    border-radius: 50%;
    transition: all 0.1s ease-in-out;
    &::after {
        content: '';
        display: block;
        border-radius: 50%;
        width: 12px;
        height: 12px;
        margin: 2px;
    }
    &:checked::after {
        background-color: ${({ theme }) => theme.palette.primary.main};
    }
    &:hover::after {
        background-color: ${({ theme }) => theme.palette.primary.light};
    }
    &:focus {
        outline: 2px solid ${({ theme }) => theme.palette.primary.wisp};
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }
`;
