import { InputHTMLAttributes } from 'react';
import { CheckWrapper, RadioButtonWrapper, StyledLabel, StyledRadio } from './RadioButton.styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import CheckSvg from '@app/components/svgs/CheckSvg.tsx';

export type RadioVariant = 'dark' | 'light' | 'neutral';

interface RadioProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    variant?: RadioVariant;
}
export default function RadioButton({ label, variant = 'neutral', ...props }: RadioProps) {
    return (
        <RadioButtonWrapper $variant={variant}>
            <StyledRadio $variant={variant} type="radio" {...props} />
            <CheckWrapper className="check">
                <CheckSvg />
            </CheckWrapper>
            {label ? (
                <StyledLabel $variant={variant} $disabled={props.disabled} htmlFor={props.id}>
                    <Typography variant="h6">{label}</Typography>
                </StyledLabel>
            ) : null}
        </RadioButtonWrapper>
    );
}
