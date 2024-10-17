import { StyledButton, ChildrenWrapper, IconWrapper } from './BaseButton.styles.ts';
import { CommonButtonProps } from './button.types.ts';

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
            <ChildrenWrapper $iconPosition={iconPosition}>{children}</ChildrenWrapper>
            {icon ? <IconWrapper $position={iconPosition}>{icon}</IconWrapper> : null}
        </StyledButton>
    );
};
