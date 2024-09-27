import { ReactNode, ButtonHTMLAttributes } from 'react';

import { BaseIconButton, BaseButton, IconWrapper, ChildrenWrapper } from './Button.styles.ts';

type ButtonVariant = 'squared' | 'rounded' | 'text';
type ButtonSize = 'small' | 'medium' | 'large';
type ButtonColor = 'error' | 'warning' | 'secondary' | 'primary';
type ButtonStyleVariant = 'contained' | 'outline' | 'simple';
type IconPosition = 'end' | 'start' | 'hug';
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    styleVariant?: ButtonStyleVariant;
    icon?: ReactNode;
    iconPosition?: IconPosition;
    children: ReactNode;
    size?: ButtonSize;
    color?: ButtonColor;
}

export const Button = ({
    variant = 'squared',
    children,
    styleVariant = 'outline',
    iconPosition = 'end',
    color = 'primary',
    size = 'medium',
    icon,
    ...props
}: ButtonProps) => {
    const outline = styleVariant === 'outline';
    const simple = styleVariant === 'simple';

    return (
        <BaseButton $color={color} $variant={variant} $outlined={outline} $simple={simple} $size={size} {...props}>
            <ChildrenWrapper>{children}</ChildrenWrapper>
            {icon ? <IconWrapper $position={iconPosition}>{icon}</IconWrapper> : null}
        </BaseButton>
    );
};

export const IconButton = ({ children, size, ...props }: ButtonProps) => (
    <BaseIconButton $size={size} {...props}>
        {children}
    </BaseIconButton>
);
