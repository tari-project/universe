import { StyledButton } from './BaseButton.styles.ts';
import { CommonButtonProps } from './button.types.ts';
import { ChildrenWrapper, IconWrapper } from '@app/components/elements/buttons/ExtendedButton.styles.ts';

type ButtonProps = CommonButtonProps;
export const Button = ({
    children,
    variant = 'primary',
    color = 'primary',
    size = 'medium',
    iconPosition,
    icon,
    ...buttonProps
}: ButtonProps) => {
    return (
        <StyledButton $variant={variant} $color={color} $size={size} {...buttonProps}>
            <ChildrenWrapper>{children}</ChildrenWrapper>
            {icon ? <IconWrapper $position={iconPosition}>{icon}</IconWrapper> : null}
        </StyledButton>
    );
};
