import { ReactNode, ButtonHTMLAttributes } from 'react';

import { BaseIconButton, BaseButton, IconWrapper, ChildrenWrapper } from './Button.styles.ts';

type ButtonVariant = 'squared' | 'rounded' | 'text';
type ButtonStyleVariant = 'contained' | 'outline';
type IconPosition = 'end' | 'start' | 'hug';
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    styleVariant?: ButtonStyleVariant;
    icon?: ReactNode;
    iconPosition?: IconPosition;
    children: ReactNode;
}

export const Button = ({
    variant = 'squared',
    children,
    styleVariant = 'outline',
    iconPosition = 'start',
    icon,
    ...props
}: ButtonProps) => (
    <BaseButton $variant={variant} $outlined={Boolean(styleVariant == 'outline')} {...props}>
        <ChildrenWrapper>{children}</ChildrenWrapper>
        {icon ? <IconWrapper $position={iconPosition}>{icon}</IconWrapper> : null}
    </BaseButton>
);

export const IconButton = ({ children, ...props }: ButtonProps) => (
    <BaseIconButton {...props}>{children}</BaseIconButton>
);
