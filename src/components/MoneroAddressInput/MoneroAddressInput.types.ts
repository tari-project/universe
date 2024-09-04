import type { Control, ControllerProps, FieldError, FieldPath, FieldValues } from 'react-hook-form';
import { InputProps } from '@app/components/elements/inputs/Input.tsx';
import { ChangeEvent } from 'react';

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
    onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
    type?: MoneroAddressInputType;
};

export interface ControlledMoneroAddressInputProps<FormValues extends FieldValues>
    extends ControlledInputType<FormValues>,
        Omit<MoneroAddressInputProps, 'error' | 'name'> {}
