import { StyledButton } from './BaseButton.styles.ts';
import { CommonButtonProps } from './button.types.ts';

type ButtonProps = CommonButtonProps;
export const Button = ({
    children,
    variant = 'primary',
    color = 'primary',
    size = 'medium',
    ...buttonProps
}: ButtonProps) => {
    return (
        <StyledButton $variant={variant} $color={color} $size={size} {...buttonProps}>
            {children}
        </StyledButton>
    );
};
