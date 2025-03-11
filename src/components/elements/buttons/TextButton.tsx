import { StyledTextButton } from './ExtendedButton.styles.ts';
import { ExtendedButtonProps } from './button.types.ts';

export const TextButton = ({
    children,
    variant,
    color = 'tariPurple',
    colorIntensity,
    size = 'medium',
    ...props
}: ExtendedButtonProps) => {
    return (
        <StyledTextButton $color={color} $colorIntensity={colorIntensity} $variant={variant} $size={size} {...props}>
            {children}
        </StyledTextButton>
    );
};
