import { ChangeEvent } from 'react';
import type { Control, ControllerProps, FieldError, FieldPath, FieldValues } from 'react-hook-form';
import { InputProps } from '@app/components/elements/inputs/Input.tsx';

export type NumberInputType = 'float' | 'int' | 'percentage';

export interface ControlledInputType<FormValues extends FieldValues> {
    name: FieldPath<FormValues>;
    control: Control<FormValues>;
    rules?: ControllerProps['rules'];
    type?: NumberInputType;
}

export type NumberInputProps = Partial<Omit<InputProps, 'error'>> & {
    title?: string;
    error?: FieldError;

    onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
    symbol?: string;
    maximum?: number;
    type?: NumberInputType;
};

export interface ControlledNumberInputProps<FormValues extends FieldValues>
    extends ControlledInputType<FormValues>,
        Omit<NumberInputProps, 'error' | 'name'> {}
