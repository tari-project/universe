import { ChangeEvent, useEffect, useState } from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { DigitInput, DigitWrapper } from './styles.ts';

export const DEFAULT_PIN_LENGTH = 6;

interface Digit {
    digit: string;
}
export interface CodeInputValues {
    code: Digit[];
}

interface PinInputProps {
    hasError?: boolean;
    isConfirm?: boolean;
    autoSubmitFn?: VoidFunction;
}
export function PinInput({ hasError = false, isConfirm = false, autoSubmitFn }: PinInputProps) {
    const [focusedIndex, setFocusedIndex] = useState(0);
    const { control, setFocus, getValues, setValue } = useFormContext<CodeInputValues>();

    const { fields } = useFieldArray({
        control,
        name: 'code',
        keyName: 'id',
        rules: {
            required: true,
        },
    });

    useEffect(() => {
        function listener(e: KeyboardEvent) {
            if (e.key === 'Backspace' || e.key === 'Delete') {
                const currentValue = getValues(`code.${focusedIndex}.digit`);
                if (!currentValue) {
                    setFocusedIndex((c) => (c > 0 ? c - 1 : c));
                }
            }
        }
        document.addEventListener('keydown', listener);
        return () => {
            document.removeEventListener('keydown', listener);
        };
    }, [focusedIndex, getValues]);

    useEffect(() => {
        setFocusedIndex(0);
    }, [isConfirm]);

    useEffect(() => {
        setFocus(`code.${focusedIndex}.digit`);
    }, [focusedIndex, setFocus]);

    function handleChange(e: ChangeEvent<HTMLInputElement>, fieldIndex: number) {
        const value = e.target.value;
        const valueIsNaN = isNaN(Number(value));
        if (!valueIsNaN) {
            if (value.length <= 1) {
                setValue(`code.${fieldIndex}.digit`, value, { shouldValidate: true });
            }

            const nativeEvent = e.nativeEvent as InputEvent;
            const isBackSpace = nativeEvent.inputType == 'deleteContentBackward';

            if (!isBackSpace) {
                setFocus(`code.${fieldIndex + 1}.digit`);
            }
        } else {
            setValue(`code.${fieldIndex}.digit`, '', { shouldValidate: true });
        }

        // Auto Submit when last digit entered
        if (autoSubmitFn && fieldIndex === fields.length - 1) {
            autoSubmitFn();
        }
    }

    const digitMarkup = fields.map((digit, i) => {
        return (
            <Controller
                control={control}
                rules={{ required: true }}
                key={digit.id}
                name={`code.${i}.digit`}
                render={({ field, formState: _, fieldState }) => {
                    return (
                        <DigitInput
                            {...field}
                            ref={field.ref}
                            type="password"
                            $isInvalid={(!!field.value && fieldState.invalid) || hasError}
                            onFocus={() => setFocusedIndex(i)}
                            onChange={(e) => {
                                e.preventDefault();
                                handleChange(e, i);
                            }}
                        />
                    );
                }}
            />
        );
    });

    return <DigitWrapper>{digitMarkup}</DigitWrapper>;
}
