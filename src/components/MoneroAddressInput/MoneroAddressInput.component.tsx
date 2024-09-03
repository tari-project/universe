import { Control, Controller, FieldValues } from 'react-hook-form';

import { FieldErrorMessage } from '../FieldErrorMessage/FieldErrorMessage.component';

import { moneroAddressRegex } from './MoneroAddressInput.constants';
import { MoneroAddressInputTypography } from './MoneroAddressInput.styles';
import type {
    ControlledMoneroAddressInputProps,
    MoneroAddressInputProps,
    MoneroAddressInputType,
} from './MoneroAddressInput.types';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Input } from '@app/components/elements/inputs/Input.tsx';
import { ChangeEvent } from 'react';

const valueParses: Record<MoneroAddressInputType, RegExp> = {
    string: moneroAddressRegex,
};

export const MoneroAddressInput = ({
    title,
    value,
    onChange,
    error,
    type = 'string',
    ...inputProps
}: MoneroAddressInputProps) => {
    const validateChange = (event: ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;

        if (onChange && (valueParses[type].test(newValue) || newValue === '')) onChange(event);
    };

    return (
        <Stack gap={1}>
            {title && <MoneroAddressInputTypography>{title}</MoneroAddressInputTypography>}
            <Stack flexDirection="row" gap={1}>
                <Input hasError={Boolean(error)} value={value} onChange={validateChange} {...inputProps} />
            </Stack>
            {error && <FieldErrorMessage error={error} />}
        </Stack>
    );
};

export const ControlledMoneroAddressInput = <FormValues extends FieldValues>({
    name,
    rules,
    control,
    ...inputProps
}: ControlledMoneroAddressInputProps<FormValues>) => (
    <Controller
        render={({ field: { onChange, value }, fieldState: { error } }) => (
            <MoneroAddressInput
                {...inputProps}
                onChange={(event) => {
                    onChange(event.target.value);
                    inputProps.onChange?.(event);
                }}
                error={error}
                value={value}
                type="string"
            />
        )}
        name={name}
        control={control as Control}
        rules={rules}
    />
);
