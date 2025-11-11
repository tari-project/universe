import { InputHTMLAttributes, ReactNode, KeyboardEvent, ChangeEvent } from 'react';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Decorator, Input, Label, Switch, Wrapper } from './styles.ts';

interface ToggleSwitchProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    isLoading?: boolean;
    customDecorators?: { first: ReactNode; second?: ReactNode };
}
export function ToggleSwitch({
    label,
    disabled,
    onChange,
    customDecorators,
    isLoading = false,
    ...props
}: ToggleSwitchProps) {
    const checked = props.checked || false;
    const hasDecorators = !!customDecorators;

    const first = customDecorators?.first;
    const second = customDecorators?.second;

    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onChange?.({ target: { checked: !props.checked } } as ChangeEvent<HTMLInputElement>);
        }
    }

    const firstDecorator = first ? (
        <Decorator $first $checked={checked}>
            {first}
        </Decorator>
    ) : null;

    const secondDecorator = second ? <Decorator $checked={checked}>{second}</Decorator> : null;

    const baseSwitch = (
        <>
            <Input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={onChange}
                onKeyDown={handleKeyDown}
                $isLoading={isLoading}
                $hasDecorators={hasDecorators}
                {...props}
            />
            <Switch $hasDecorators={hasDecorators} />
        </>
    );

    const switchMarkup = (
        <Wrapper $isLoading={isLoading} $disabled={disabled}>
            {firstDecorator}
            {secondDecorator}
            {baseSwitch}
        </Wrapper>
    );

    if (label) {
        return (
            <Label $disabled={disabled}>
                <Typography variant="h6">{label}</Typography>
                {switchMarkup}
            </Label>
        );
    }

    return switchMarkup;
}
