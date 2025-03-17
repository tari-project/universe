import styled, { css } from 'styled-components';
import { ExtendedButtonStyleProps, ExtendedButtonProps } from './button.types.ts';
import { convertHexToRGBA } from '@app/utils';

const BaseIconButton = styled.button<ExtendedButtonStyleProps>`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border-radius: 100%;
    transition: background 0.2s ease-in;
    cursor: pointer;
    background: none;

    &:hover {
        background: ${({ theme }) =>
            `linear-gradient(0deg, ${convertHexToRGBA(theme.palette.primary.accent, 0.05)} 0%, ${convertHexToRGBA(theme.palette.background.paper, 0.7)} 50%)`};
    }
    &:disabled {
        opacity: 0.3;
        pointer-events: none;
    }

    ${({ $active }) =>
        $active &&
        css`
            background: ${({ theme }) =>
                `linear-gradient(0deg, ${convertHexToRGBA(theme.palette.primary.accent, 0.07)} -10%, ${convertHexToRGBA(theme.palette.background.main, 0.9)} 50%)`};
        `}

    ${({ $variant, $size }) => {
        switch ($size) {
            case 'small': {
                return css`
                    height: 24px;
                    width: 24px;
                    padding: 4px;
                    svg {
                        height: 14px;
                    }
                `;
            }
            case 'large': {
                return css`
                    height: 41px;
                    width: 41px;
                `;
            }
            case 'medium':
            default: {
                if ($variant === 'secondary') {
                    return css`
                        width: 56px;
                        height: 56px;
                        border-radius: 12px;
                        padding: 14px;
                    `;
                }
                return css`
                    height: 34px;
                    width: 34px;
                `;
            }
        }
    }}
`;

export const IconButton = ({ children, active, variant = 'primary', size, ...props }: ExtendedButtonProps) => (
    <BaseIconButton $variant={variant} $color="grey" $active={active} $size={size} {...props}>
        {children}
    </BaseIconButton>
);
