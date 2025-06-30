import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { DigitWrapper, Wrapper } from './styles.ts';

const DEFAULT_PIN_LENGTH = 6;
const pinArr = Array.from({ length: DEFAULT_PIN_LENGTH }, (_, i) => i + 1);

interface IDigitInputs {
    digit?: number;
}

interface IFields {
    digits: IDigitInputs[];
}
export default function PinInput() {
    const { control, setFocus } = useForm<IFields>({
        shouldUseNativeValidation: true,
        defaultValues: { digits: pinArr.map((d) => ({ [`digit${d}`]: undefined })) },
    });

    const { fields } = useFieldArray({
        control,
        name: 'digits',
        keyName: 'id',
        rules: {
            maxLength: 1,
            required: true,
        },
    });

    const digitMarkup = fields.map((digit, i) => {
        return (
            <Controller
                control={control}
                key={digit.id}
                name={`digits.${i}.digit`}
                render={({ field }) => {
                    return (
                        <DigitWrapper
                            ref={field.ref}
                            type="number"
                            max={9}
                            onChange={(e) => {
                                field.onChange(e);
                                setFocus(`digits.${i + 1}.digit`);
                            }}
                        />
                    );
                }}
            />
        );
    });

    return <Wrapper>{digitMarkup}</Wrapper>;
}
