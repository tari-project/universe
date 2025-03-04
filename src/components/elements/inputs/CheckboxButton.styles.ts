import styled, { css } from 'styled-components';

interface Props {
    $variant: 'dark' | 'light' | 'neutral';
    $disabled?: boolean;
}

export const CheckboxButtonWrapper = styled.label<Props>`
    gap: 18px;
    display: flex;
    align-items: center;
    justify-content: stretch;
    width: 100%;
    padding: 12px 25px;
    color: transparent;
    cursor: pointer;
    input:checked ~ span {
        color: #fff;
    }
`;

export const StyledLabel = styled.div<Props>`
    text-transform: capitalize;
    width: 100%;
    cursor: pointer;
    ${({ $variant }) => {
        switch ($variant) {
            case 'dark': {
                return css`
                    color: ${({ theme }) => theme.palette.action.text.light};
                `;
            }
            case 'light': {
                return css`
                    color: ${({ theme }) => theme.palette.action.text.contrast};
                `;
            }
            case 'neutral':
            default: {
                return css`
                    color: ${({ theme }) => theme.palette.text.primary};
                `;
            }
        }
    }};

    ${({ $disabled }) =>
        $disabled &&
        css`
            opacity: 0.8;
            cursor: not-allowed;
        `}
`;

export const CheckWrapper = styled.span<{ $checked?: boolean }>`
    position: absolute;
    z-index: 2;
    width: 20px;
    height: 20px;
    color: transparent;
    svg {
        max-width: 100%;
    }
`;

export const StyledCheckbox = styled.input<Props>`
    position: relative;
    appearance: none;
    margin: 0;
    width: 20px;
    height: 20px;
    border-width: 2px;
    border-style: solid;
    border-color: ${({ $variant }) => ($variant === 'dark' ? '#fff' : '#000')};
    // border-radius: 50%;
    transition: all 0.1s ease-in-out;
    color: transparent;

    &::after {
        content: '';
        display: block;
        // border-radius: 50%;
        width: 12px;
        height: 12px;
        margin: 2px;
    }
    &:active::after {
        background-color: ${({ $variant }) => ($variant === 'dark' ? '#fff' : '#000')};
    }
    &:checked {
        border-color: ${({ theme }) => theme.palette.success.main};
        background-color: ${({ theme }) => theme.palette.success.main};
    }
    &:checked::after {
        background-color: ${({ theme }) => theme.palette.success.main};
    }

    &:hover:not(:checked)::after {
        background-color: ${({ $variant }) => ($variant === 'dark' ? '#fff' : '#000')};
        opacity: 0.7;
    }
    &:disabled {
        pointer-events: none;
        opacity: 0.5;
    }
`;
