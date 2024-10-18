import { InputHTMLAttributes } from 'react';
import { RadioButtonWrapper, StyledLabel, StyledRadio } from './RadioButton.styles.ts';
import { themeType } from '@app/store/types.ts';
import { Typography } from '@app/components/elements/Typography.tsx';

interface RadioProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    variant?: themeType;
}
export default function RadioButton({ label, variant = 'system', ...props }: RadioProps) {
    return (
        <RadioButtonWrapper $variant={variant}>
            <StyledRadio $variant={variant} type="radio" {...props} />
            {label ? (
                <StyledLabel $variant={variant} $disabled={props.disabled} htmlFor={props.id}>
                    <Typography variant="h6">{label}</Typography>
                </StyledLabel>
            ) : null}
        </RadioButtonWrapper>
    );
}
