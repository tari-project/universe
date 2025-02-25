import styled, { css } from 'styled-components';
import { RadioType } from './RadioButton.tsx';
import { convertHexToRGBA } from '@app/utils';

interface Props {
    $variant: 'dark' | 'light' | 'neutral';
    $styleType?: RadioType;
    $disabled?: boolean;
}

export const RadioButtonWrapper = styled.label<Props>`
    gap: 6px;
    display: flex;
    align-items: center;
    justify-content: stretch;
    width: 100%;

    color: transparent;
    cursor: pointer;
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    border-width: 1px;
    border-style: solid;
    border-color: rgba(0, 0, 0, ${({ $variant }) => ($variant === 'dark' ? 0.2 : 0.1)});
    input:checked ~ span {
        color: #fff;
    }

    ${({ theme, $variant, $styleType }) => {
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
                    background-color: ${$styleType === 'minimal'
                        ? convertHexToRGBA(theme.palette.contrast, 0.04)
                        : theme.colorsAlpha.darkAlpha[10]};
                `;
            }
        }
    }};

    ${({ $styleType }) =>
        $styleType === 'minimal'
            ? css`
                  padding: 0 12px;
                  height: 40px;
              `
            : css`
                  padding: 0 25px;
                  height: 55px;
              `}
`;

export const StyledLabel = styled.div<Props>`
    width: 100%;
    cursor: pointer;
    -webkit-user-select: none;
    ${({ $variant, $styleType }) => {
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
                    color: ${({ theme }) =>
                        $styleType === 'minimal' ? theme.palette.text.accent : theme.palette.text.primary};
                `;
            }
        }
    }};

    ${({ $styleType }) =>
        $styleType === 'minimal'
            ? css`
                  padding-left: 6px;
              `
            : css`
                  text-align: center;
                  text-transform: capitalize;
              `}

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
