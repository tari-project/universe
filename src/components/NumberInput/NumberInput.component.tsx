import { Control, Controller, FieldValues } from 'react-hook-form';

import { FieldErrorMessage } from '../FieldErrorMessage/FieldErrorMessage.component';

import { decimalRegex, integerRegex, percentageRegex } from './NumberInput.constants';
import { NumberInputTypography } from './NumberInput.styles';
import type { ControlledNumberInputProps, NumberInputProps, NumberInputType } from './NumberInput.types';
import { Stack } from '@app/components/elements/Stack.tsx';

const valueParses: Record<NumberInputType, RegExp> = {
    int: integerRegex,
    float: decimalRegex,
    percentage: percentageRegex,
};

export const NumberInput: React.FC<NumberInputProps> = ({
    title,
    value,
    onChange,
    error,
    symbol = '$',
    type = 'float',
    maximum,
    ...inputProps
}) => {
    return (
        <Stack>
            {title && (
                <NumberInputTypography variant="p" component="label">
                    {title}
                </NumberInputTypography>
            )}
            <Stack flexDirection="row" gap={1}>
                {/*<Input*/}
                {/*    error={Boolean(error)}*/}
                {/*    fullWidth*/}
                {/*    value={value}*/}
                {/*    onChange={validateChange}*/}
                {/*    endAdornment={*/}
                {/*        maximum !== undefined ? (*/}
                {/*            <InputAdornment*/}
                {/*                position="end"*/}
                {/*                sx={{ cursor: 'pointer' }}*/}
                {/*                onClick={() =>*/}
                {/*                    validateChange({*/}
                {/*                        target: { value: String(maximum) },*/}
                {/*                    } as React.ChangeEvent<HTMLInputElement>)*/}
                {/*                }*/}
                {/*            >*/}
                {/*                MAX*/}
                {/*            </InputAdornment>*/}
                {/*        ) : (*/}
                {/*            symbol && <InputAdornment position="end">{symbol}</InputAdornment>*/}
                {/*        )*/}
                {/*    }*/}
                {/*    {...inputProps}*/}
                {/*/>*/}
            </Stack>
            {error && <FieldErrorMessage error={error} />}
        </Stack>
    );

    const validateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;

        if (onChange && (valueParses[type].test(newValue) || newValue === '')) onChange(event);
    };
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
        control={control as Control<FieldValues>}
        rules={rules}
    />
);
