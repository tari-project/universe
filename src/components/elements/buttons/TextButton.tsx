import { StyledTextButton } from './ExtendedButton.styles.ts';
import { ExtendedButtonProps } from './button.types.ts';

export const TextButton = ({
    children,
    variant,
    color = 'grey',
    colorIntensity,
    size = 'medium',
    fluid,
    ...props
}: ExtendedButtonProps) => {
    return (
        <StyledTextButton
            $color={color}
            $colorIntensity={colorIntensity}
            $variant={variant}
            $size={size}
            $fluid={fluid}
            {...props}
        >
            {children}
        </StyledTextButton>
    );
};
