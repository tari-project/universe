import { InputHTMLAttributes, ReactNode } from 'react';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Decorator, Input, Label, Switch, Wrapper } from './styles.ts';

interface ToggleSwitchProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    customDecorators?: { first: ReactNode; second?: ReactNode };
    variant?: 'solid' | 'gradient';
    isLoading?: boolean;
}
export function ToggleSwitch({
    label,
    variant = 'solid',
    disabled,
    onChange,
    customDecorators,
    isLoading = false,
    ...props
}: ToggleSwitchProps) {
    const isSolid = variant === 'solid';

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            onChange?.({ target: { checked: !props.checked } } as React.ChangeEvent<HTMLInputElement>);
        }
    };

    const switchMarkup = (
        <Wrapper $isLoading={isLoading} $disabled={disabled}>
            {customDecorators?.first ? (
                <Decorator $first $checked={props.checked}>
                    {customDecorators?.first}
                </Decorator>
            ) : null}
            {customDecorators?.second ? (
                <Decorator $checked={props.checked}>{customDecorators?.second}</Decorator>
            ) : null}
            <Input
                $isLoading={isLoading}
                disabled={disabled}
                checked={props.checked || false}
                type="checkbox"
                onChange={onChange}
                onKeyDown={handleKeyDown}
                $hasDecorators={!!customDecorators}
                $isSolid={isSolid}
                {...props}
            />
            <Switch $hasDecorators={!!customDecorators} />
        </Wrapper>
    );

    if (label) {
        return (
            <Label $disabled={disabled}>
                <Typography variant="h6">{label}</Typography>
                {switchMarkup}
            </Label>
        );
    } else {
        return switchMarkup;
    }
}
