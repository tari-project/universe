import { StyledButton, ChildrenWrapper, IconWrapper } from './BaseButton.styles.ts';
import { CommonButtonProps } from './button.types.ts';

type ButtonProps = CommonButtonProps & {
    disableColour?: boolean;
};
export const Button = ({
    children,
    variant = 'primary',
    color,
    size = 'medium',
    iconPosition,
    disableColour = false,
    icon,
    ...buttonProps
}: ButtonProps) => {
    return (
        <StyledButton $variant={variant} $color={color} $size={size} $disableColour={disableColour} {...buttonProps}>
            <ChildrenWrapper $iconPosition={iconPosition}>{children}</ChildrenWrapper>
            {icon ? <IconWrapper $position={iconPosition}>{icon}</IconWrapper> : null}
        </StyledButton>
    );
};
