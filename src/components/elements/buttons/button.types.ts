import { ButtonHTMLAttributes, ReactNode } from 'react';
import { ThemeColourGroup } from '@app/theme/palettes/colors.ts';

export type ButtonVariant = 'primary' | 'secondary' | 'outlined' | 'gradient';
export type ButtonSize = 'xs' | 'small' | 'medium' | 'large';
export type ButtonColor = 'transparent' | 'primary' | 'secondary' | 'gradient' | 'error' | 'warning' | 'info';

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
    $iconPosition?: CommonButtonProps['iconPosition'];
    $disableColour?: boolean;
}

export interface ExtendedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    color?: ThemeColourGroup;
    variant?: ButtonVariant;
    size?: ButtonSize;
    colorIntensity?: number;
}

export interface ExtendedButtonStyleProps {
    $color: ThemeColourGroup;
    $variant?: ExtendedButtonProps['variant'];
    $size?: ExtendedButtonProps['size'];
    $colorIntensity?: ExtendedButtonProps['colorIntensity'];
}
