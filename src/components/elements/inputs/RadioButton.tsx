import { InputHTMLAttributes } from 'react';
import { CheckWrapper, RadioButtonWrapper, StyledLabel, StyledRadio } from './RadioButton.styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import CheckSvg from '@app/components/svgs/CheckSvg.tsx';

export type RadioVariant = 'dark' | 'light' | 'neutral';
export type RadioType = 'centered' | 'aligned';

interface RadioProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    variant?: RadioVariant;
    styleType?: RadioType;
}
export default function RadioButton({ label, variant = 'neutral', styleType = 'centered', ...props }: RadioProps) {
    return (
        <RadioButtonWrapper $variant={variant} $styleType={styleType}>
            <StyledRadio $variant={variant} type="radio" {...props} />
            <CheckWrapper className="check">
                <CheckSvg />
            </CheckWrapper>
            {label ? (
                <StyledLabel $variant={variant} $disabled={props.disabled} $styleType={styleType}>
                    <Typography variant="h6">{label}</Typography>
                </StyledLabel>
            ) : null}
        </RadioButtonWrapper>
    );
}
