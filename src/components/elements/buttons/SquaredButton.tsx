import { ButtonSquared } from './ExtendedButton.styles.ts';
import { ExtendedButtonProps } from './button.types.ts';

export type SquaredButtonProps = ExtendedButtonProps;

export const SquaredButton = ({ children, variant, color = 'grey', size = 'medium', ...props }: SquaredButtonProps) => {
    return (
        <ButtonSquared $color={color} $variant={variant} $size={size} {...props}>
            {children}
        </ButtonSquared>
    );
};
