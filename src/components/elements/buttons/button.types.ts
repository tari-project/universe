import { ButtonHTMLAttributes, ReactNode } from 'react';
import { ThemeColourGroup } from '@app/theme/palettes/colors.ts';

type ButtonColor = 'transparent' | 'primary' | 'secondary' | 'gradient' | 'error' | 'warning' | 'info' | 'grey';
type ButtonBackgroundColor = 'transparent' | ThemeColourGroup;

export type ButtonVariant = 'primary' | 'secondary' | 'outlined' | 'gradient' | 'green' | 'purple' | 'yellow';
export type ButtonSize = 'xs' | 'smaller' | 'small' | 'medium' | 'large' | 'xlarge';

export type IconPosition = 'end' | 'start' | 'hug';

export interface CommonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    icon?: ReactNode;
    loader?: ReactNode;
    iconPosition?: IconPosition;
    size?: ButtonSize;
    color?: ButtonColor;
    backgroundColor?: ButtonBackgroundColor;
    fluid?: boolean;
    isLoading?: boolean;
}

export interface ButtonStyleProps {
    $variant?: CommonButtonProps['variant'];
    $size?: CommonButtonProps['size'];
    $color?: CommonButtonProps['color'];
    $backgroundColor?: CommonButtonProps['backgroundColor'];
    $iconPosition?: CommonButtonProps['iconPosition'];
    $disableColour?: boolean;
    $fluid?: boolean;
}

export interface ExtendedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    color?: ThemeColourGroup;
    variant?: ButtonVariant;
    size?: ButtonSize;
    colorIntensity?: number;
    active?: boolean;
}

export interface ExtendedButtonStyleProps {
    $color: ThemeColourGroup;
    $variant?: ExtendedButtonProps['variant'];
    $size?: ExtendedButtonProps['size'];
    $colorIntensity?: ExtendedButtonProps['colorIntensity'];
    $active?: boolean;
}
