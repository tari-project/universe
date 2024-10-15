import { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outlined' | 'gradient';
export type ButtonSize = 'xs' | 'small' | 'medium' | 'large';
export type ButtonColor = 'primary' | 'secondary' | 'gradient' | 'error' | 'warning' | 'info';

export type IconPosition = 'end' | 'start' | 'hug';

export interface CommonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    icon?: ReactNode;
    iconPosition?: IconPosition;
    size?: ButtonSize;
    color?: ButtonColor;
}

export interface ButtonStyleProps {
    $variant?: CommonButtonProps['variant'];
    $size?: CommonButtonProps['size'];
    $color?: CommonButtonProps['color'];
}
