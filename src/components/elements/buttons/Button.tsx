import { memo } from 'react';
import { CommonButtonProps } from './button.types.ts';
import { StyledButton, ChildrenWrapper, IconWrapper } from './BaseButton.styles.ts';

type ButtonProps = CommonButtonProps & {
    disableColour?: boolean;
};

const Button = memo(function Button({
    children,
    variant = 'primary',
    color,
    backgroundColor,
    size = 'medium',
    iconPosition,
    disableColour = false,
    fluid = false,
    isLoading = false,
    loader,
    icon,
    ...buttonProps
}: ButtonProps) {
    return (
        <StyledButton
            $variant={variant}
            $color={color}
            $backgroundColor={backgroundColor}
            $size={size}
            $disableColour={disableColour}
            $fluid={fluid}
            {...buttonProps}
        >
            <ChildrenWrapper $iconPosition={iconPosition}>{children}</ChildrenWrapper>
            {icon ? <IconWrapper $position={iconPosition}>{icon}</IconWrapper> : null}
            {loader && isLoading && !icon ? (
                <IconWrapper $position="end" $isLoader>
                    {loader}
                </IconWrapper>
            ) : null}
        </StyledButton>
    );
});
export { Button };
