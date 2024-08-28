import type { InputProps, TypographyProps } from '@mui/material';
import type {
    Control,
    ControllerProps,
    FieldError,
    FieldPath,
    FieldValues,
} from 'react-hook-form';

export type NumberInputType = 'float' | 'int' | 'percentage';

export type ControlledInputType<FormValues extends FieldValues> = {
    name: FieldPath<FormValues>;
    control: Control<FormValues>;
    rules?: ControllerProps['rules'];
    type?: NumberInputType;
};

export type NumberInputProps = Partial<Omit<InputProps, 'error'>> & {
    title?: string;
    error?: FieldError;
    labelSx?: TypographyProps['sx'];
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    symbol?: string;
    maximum?: number;
    type?: NumberInputType;
};

export interface ControlledNumberInputProps<FormValues extends FieldValues>
    extends ControlledInputType<FormValues>,
    Omit<NumberInputProps, 'error' | 'name'> {}
