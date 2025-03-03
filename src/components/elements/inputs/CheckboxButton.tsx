import { InputHTMLAttributes } from 'react';
import { CheckWrapper, CheckboxButtonWrapper, StyledCheckbox, StyledLabel } from './CheckboxButton.styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import CheckSvg from '@app/components/svgs/CheckSvg.tsx';

export type RadioVariant = 'dark' | 'light' | 'neutral';

interface RadioProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    description?: string;
    variant?: RadioVariant;
}
export default function CheckboxButton({ label, description, variant = 'neutral', ...props }: RadioProps) {
    return (
        <CheckboxButtonWrapper $variant={variant}>
            <StyledCheckbox $variant={variant} type="checkbox" {...props} />
            <CheckWrapper className="check">
                <CheckSvg />
            </CheckWrapper>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    alignItems: 'flex-start',
                    textAlign: 'left',
                    justifyContent: 'flex-start',
                }}
            >
                {label ? (
                    <StyledLabel $variant={variant} $disabled={props.disabled}>
                        <Typography variant="h6">{label}</Typography>
                    </StyledLabel>
                ) : null}
                {description ? (
                    <StyledLabel $variant={variant} $disabled={props.disabled}>
                        <Typography variant="p">{description}</Typography>
                    </StyledLabel>
                ) : null}
            </div>
        </CheckboxButtonWrapper>
    );
}
