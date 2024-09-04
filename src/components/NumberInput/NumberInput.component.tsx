import { Control, Controller, FieldValues } from 'react-hook-form';

import { FieldErrorMessage } from '../FieldErrorMessage/FieldErrorMessage.component';

import { decimalRegex, integerRegex, percentageRegex } from './NumberInput.constants';
import { NumberInputTypography } from './NumberInput.styles';
import type { ControlledNumberInputProps, NumberInputProps, NumberInputType } from './NumberInput.types';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Input } from '@app/components/elements/inputs/Input.tsx';
import { ChangeEvent, ReactNode } from 'react';
const valueParses: Record<NumberInputType, RegExp> = {
    int: integerRegex,
    float: decimalRegex,
    percentage: percentageRegex,
};

function InputAdornment({ children, onClick }: { children?: ReactNode; onClick?: () => void }) {
    return (
        <div onClick={onClick} style={{ height: 60 }}>
            {children}
        </div>
    );
}

export const NumberInput = ({
    title,
    value,
    onChange,
    error,
    symbol = '$',
    type = 'float',
    maximum,
    ...inputProps
}: NumberInputProps) => {
    const validateChange = (event: ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;

        if (onChange && (valueParses[type].test(newValue) || newValue === '')) onChange(event);
    };
    return (
        <Stack>
            {title && (
                <NumberInputTypography variant="p" component="label">
                    {title}
                </NumberInputTypography>
            )}
            <Stack style={{ height: 30 }} justifyContent="flex-start" gap={8}>
                <Input
                    hasError={Boolean(error)}
                    value={value}
                    onChange={validateChange}
                    endAdornment={
                        maximum !== undefined ? (
                            <InputAdornment
                                onClick={() =>
                                    validateChange({
                                        target: { value: String(maximum) },
                                    } as ChangeEvent<HTMLInputElement>)
                                }
                            >
                                MAX
                            </InputAdornment>
                        ) : (
                            symbol && <InputAdornment>{symbol}</InputAdornment>
                        )
                    }
                    {...inputProps}
                />
                {error ? <FieldErrorMessage error={error} /> : null}
            </Stack>
        </Stack>
    );
};
export const ControlledNumberInput = <FormValues extends FieldValues>({
    name,
    rules,
    control,
    type = 'float',
    ...inputProps
}: ControlledNumberInputProps<FormValues>) => (
    <Controller
        render={({ field: { onChange, value }, fieldState: { error } }) => (
            <NumberInput
                {...inputProps}
                onChange={(event) => {
                    onChange(Number(event.target.value));
                    inputProps.onChange?.(event);
                }}
                error={error}
                value={value}
                type={type}
            />
        )}
        name={name}
        control={control as Control}
        rules={rules}
    />
);
