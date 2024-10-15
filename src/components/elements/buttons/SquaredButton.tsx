import { BaseButton, IconWrapper, ChildrenWrapper } from './ExtendedButton.styles.ts';
import { CommonButtonProps } from './button.types.ts';

export type SquaredButtonProps = CommonButtonProps;

export const SquaredButton = ({
    children,
    variant,
    iconPosition = 'end',
    color = 'primary',
    size = 'medium',
    icon,
    ...props
}: SquaredButtonProps) => {
    return (
        <BaseButton $color={color} $variant={variant} $size={size} {...props}>
            <ChildrenWrapper>{children}</ChildrenWrapper>
            {icon ? <IconWrapper $position={iconPosition}>{icon}</IconWrapper> : null}
        </BaseButton>
    );
};
