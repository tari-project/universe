import type { InputProps, TypographyProps } from '@mui/material';
import type { Control, ControllerProps, FieldError, FieldPath, FieldValues } from 'react-hook-form';

export type MoneroAddressInputType = 'string';

export interface ControlledInputType<FormValues extends FieldValues> {
    name: FieldPath<FormValues>;
    control: Control<FormValues>;
    rules?: ControllerProps['rules'];
    type?: MoneroAddressInputType;
}

export type MoneroAddressInputProps = Partial<Omit<InputProps, 'error'>> & {
    title?: string;
    error?: FieldError;
    labelSx?: TypographyProps['sx'];
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    type?: MoneroAddressInputType;
};

export interface ControlledMoneroAddressInputProps<FormValues extends FieldValues>
    extends ControlledInputType<FormValues>,
        Omit<MoneroAddressInputProps, 'error' | 'name'> {}
