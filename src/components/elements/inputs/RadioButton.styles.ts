import styled, { css } from 'styled-components';

interface Props {
    $variant: 'dark' | 'light' | 'neutral';
    $disabled?: boolean;
}

export const RadioButtonWrapper = styled.div<Props>`
    gap: 6px;
    display: flex;
    align-items: center;
    justify-content: stretch;
    width: 100%;
    padding: 0 25px;
    height: 55px;
    color: transparent;
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    border-width: 1px;
    border-style: solid;
    border-color: rgba(0, 0, 0, ${({ $variant }) => ($variant === 'dark' ? 0.2 : 0.1)});
    input:checked ~ span {
        color: #fff;
    }

    ${({ theme, $variant }) => {
        switch ($variant) {
            case 'dark': {
                return css`
                    background-color: #000;
                `;
            }
            case 'light': {
                return css`
                    background-color: rgba(255, 255, 255, 0.85);
                `;
            }
            case 'neutral':
            default: {
                return css`
                    background-color: ${theme.colorsAlpha.darkAlpha[10]};
                `;
            }
        }
    }};
`;

export const StyledLabel = styled.label<Props>`
    text-transform: capitalize;
    user-select: none;
    text-align: center;
    width: 100%;

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
export const StyledRadio = styled.input<Props>`
    position: relative;
    appearance: none;
    margin: 0;
    width: 20px;
    height: 20px;
    border-width: 2px;
    border-style: solid;
    border-color: ${({ $variant }) => ($variant === 'dark' ? '#fff' : '#000')};
    border-radius: 50%;
    transition: all 0.1s ease-in-out;
    color: transparent;

    &::after {
        content: '';
        display: block;
        border-radius: 50%;
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
