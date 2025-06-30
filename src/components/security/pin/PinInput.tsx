import { ChangeEvent, useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { DigitInput, DigitWrapper, FormCTA, Wrapper } from './styles.ts';

const DEFAULT_PIN_LENGTH = 6;
const pinArr = Array.from({ length: DEFAULT_PIN_LENGTH }, (_, i) => i);

interface Digit {
    digit: string;
}
interface Values {
    code: Digit[];
}
export function PinInput() {
    const [focusedIndex, setFocusedIndex] = useState(0);
    const { control, setFocus, getValues, setValue, handleSubmit } = useForm<Values>({
        defaultValues: { code: pinArr.map((_) => ({ digit: '' })) },
    });

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
                            $isInvalid={!!field.value && fieldState.invalid}
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

    function onSubmit(data) {
        const codeValue = data.code.map(({ digit }) => digit).join('');
        console.debug(`codeValue= `, codeValue);
    }
    // console.debug(`formState.isValid= `, formState.isValid);
    return (
        <Wrapper onSubmit={handleSubmit(onSubmit)}>
            <DigitWrapper>{digitMarkup}</DigitWrapper>
            <FormCTA fluid disabled={false} type="submit">{`Submit`}</FormCTA>
        </Wrapper>
    );
}
