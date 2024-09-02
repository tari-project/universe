import { Input, Stack } from '@mui/material';
import { Control, Controller, FieldValues } from 'react-hook-form';

import { FieldErrorMessage } from '../FieldErrorMessage/FieldErrorMessage.component';

import { moneroAddressRegex } from './MoneroAddressInput.constants';
import { MoneroAddressInputTypography } from './MoneroAddressInput.styles';
import type {
    ControlledMoneroAddressInputProps,
    MoneroAddressInputProps,
    MoneroAddressInputType,
} from './MoneroAddressInput.types';

const valueParses: Record<MoneroAddressInputType, RegExp> = {
    string: moneroAddressRegex,
};

export const MoneroAddressInput: React.FC<MoneroAddressInputProps> = ({
    title,
    value,
    onChange,
    labelSx,
    error,
    type = 'string',
    ...inputProps
}) => {
    const validateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;

        if (onChange && (valueParses[type].test(newValue) || newValue === '')) onChange(event);
    };

    return (
        <Stack
            gap={1}
            sx={{
                width: 'auto',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                position: 'relative',
                ...inputProps.sx,
            }}
        >
            {title && (
                <MoneroAddressInputTypography variant="body1" component="label" sx={labelSx}>
                    {title}
                </MoneroAddressInputTypography>
            )}
            <Stack flexDirection="row" gap={1}>
                <Input error={Boolean(error)} fullWidth value={value} onChange={validateChange} {...inputProps} />
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
        control={control as Control<FieldValues>}
        rules={rules}
    />
);
