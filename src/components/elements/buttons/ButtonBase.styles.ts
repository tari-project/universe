import styled, { css } from 'styled-components';
import { ButtonBaseProps } from './ButtonBase.tsx';

interface Props {
    $variant?: ButtonBaseProps['variant'];
    $size?: ButtonBaseProps['size'];
    $color?: ButtonBaseProps['color'];
}
export const StyledButtonBase = styled.button<Props>`
    line-height: ${({ theme }) => theme.typography.h6.lineHeight};
    font-family: ${({ theme }) => theme.typography.fontFamily};
    letter-spacing: ${({ theme }) => theme.typography.h6.letterSpacing};
    font-weight: ${({ theme }) => theme.typography.h6.fontWeight};
    border-radius: ${({ theme }) => theme.shape.borderRadius.buttonBase};
    background: ${({ theme }) => theme.palette.background.paper};
    white-space: pre;
    padding: 0 25px;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    display: flex;
    font-size: inherit;
    transition: all 0.25s ease-in-out;

    &:active {
        opacity: 0.9;
    }
    &:disabled {
        opacity: 0.5;
        cursor: inherit;
    }
    &:hover {
        opacity: 0.85;
    }

    ${({ $variant, $color }) => {
        switch ($variant) {
            case 'outlined':
                return css`
                    border: 1px solid ${({ theme }) => theme.palette[$color || 'primary'].light};
                    color: ${({ theme }) => theme.palette.base};
                    background: ${({ theme }) => theme.palette[$color || 'primary'].main};
                `;
            case 'gradient':
                return css`
                    background: linear-gradient(86deg, #780eff -4.33%, #bf28ff 102.27%);
                    color: ${({ theme }) => theme.palette.text.contrast};
                    &:hover {
                        background: linear-gradient(86deg, #780eff -24.33%, #bf28ff 78.27%);
                    }
                `;
            case 'secondary':
                return css`
                    box-shadow: 0 2px 20px -10px rgba(0, 0, 0, 0.076);
                    color: ${({ theme }) => theme.palette[$color || 'primary'].main};
                    background: ${({ theme }) => theme.palette[$color || 'background'].paper};
                `;
            case 'primary':
            default:
                return css`
                    background: ${({ theme }) => theme.palette.background.default};
                    &:hover {
                        background: ${({ theme }) => theme.palette.colors.grey[100]};
                    }
                `;
        }
    }}

    ${({ $size }) => {
        switch ($size) {
            case 'xs':
                return css`
                    padding: 0 8px;
                    font-size: 10px;
                `;
            case 'small':
                return css`
                    padding: 6px 12px;
                    font-size: 14px;
                `;
            case 'large':
                return css`
                    height: 50px;
                    width: 190px;
                `;
            case 'medium':
            default:
                return css`
                    height: 40px;
                    width: min-content;
                `;
        }
    }}
`;
