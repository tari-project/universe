import { ChildrenWrapper, StyledTextButton } from './ExtendedButton.styles.ts';
import { CommonButtonProps } from './button.types.ts';

export type TextButtonProps = Omit<CommonButtonProps, 'icon' | 'iconPosition'>;

export const TextButton = ({ children, variant, color = 'primary', size = 'medium', ...props }: TextButtonProps) => {
    return (
        <StyledTextButton $color={color} $variant={variant} $size={size} {...props}>
            <ChildrenWrapper>{children}</ChildrenWrapper>
        </StyledTextButton>
    );
};
