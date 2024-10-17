import { ChildrenWrapper, StyledTextButton } from './ExtendedButton.styles.ts';
import { CommonButtonProps } from './button.types.ts';
import { ThemeColourGroup } from '@app/theme/colors.ts';

export type TextButtonProps = Omit<CommonButtonProps, 'icon' | 'iconPosition' | 'color'> & {
    color?: ThemeColourGroup;
    colorIntensity?: number;
};

export const TextButton = ({
    children,
    variant,
    color = 'tariPurple',
    colorIntensity = 500,
    size = 'medium',
    ...props
}: TextButtonProps) => {
    return (
        <StyledTextButton $color={color} $colorIntensity={colorIntensity} $variant={variant} $size={size} {...props}>
            <ChildrenWrapper>{children}</ChildrenWrapper>
        </StyledTextButton>
    );
};
