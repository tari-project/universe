import { ButtonSquared } from './ExtendedButton.styles.ts';
import { ExtendedButtonProps } from './button.types.ts';
import { memo } from 'react';

const SquaredButton = memo(function SquaredButton({
    children,
    variant,
    color = 'grey',
    size = 'medium',
    ...props
}: ExtendedButtonProps) {
    return (
        <ButtonSquared $color={color} $variant={variant} $size={size} {...props}>
            {children}
        </ButtonSquared>
    );
});

export { SquaredButton };
