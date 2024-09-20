import { ButtonHTMLAttributes } from 'react';
import { StyledButtonBase } from './ButtonBase.styles.ts';

type ButtonBaseVariant = 'primary' | 'secondary' | 'outlined' | 'gradient';
type ButtonBaseColor = 'primary' | 'secondary' | 'gradient';

export interface ButtonBaseProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonBaseVariant;
    color?: ButtonBaseColor;
}
export const ButtonBase = ({ children, variant = 'primary', color = 'primary', ...buttonProps }: ButtonBaseProps) => {
    return (
        <StyledButtonBase $variant={variant} $color={color} {...buttonProps}>
            {children}
        </StyledButtonBase>
    );
};
