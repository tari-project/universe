import { ButtonHTMLAttributes } from 'react';
import { StyledButtonBase } from './ButtonBase.styles.ts';

type ButtonBaseVariant = 'primary' | 'secondary' | 'outlined' | 'gradient';
type ButtonBaseColor = 'primary' | 'secondary' | 'gradient';
type ButtonBaseSize = 'small' | 'medium' | 'large';

export interface ButtonBaseProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonBaseVariant;
    color?: ButtonBaseColor;
    size?: ButtonBaseSize;
}
export const ButtonBase = ({
    children,
    variant = 'primary',
    color = 'primary',
    size = 'medium',
    ...buttonProps
}: ButtonBaseProps) => {
    return (
        <StyledButtonBase $variant={variant} $color={color} $size={size} {...buttonProps}>
            {children}
        </StyledButtonBase>
    );
};
