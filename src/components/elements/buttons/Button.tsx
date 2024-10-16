import { StyledButton } from './BaseButton.styles.ts';
import { CommonButtonProps } from './button.types.ts';
import { IconWrapper } from '@app/components/elements/buttons/ExtendedButton.styles.ts';

type ButtonProps = CommonButtonProps;
export const Button = ({
    children,
    variant = 'primary',
    color,
    size = 'medium',
    iconPosition,
    icon,
    ...buttonProps
}: ButtonProps) => {
    return (
        <StyledButton $variant={variant} $color={color} $size={size} {...buttonProps}>
            {children}
            {icon ? <IconWrapper $position={iconPosition}>{icon}</IconWrapper> : null}
        </StyledButton>
    );
};
