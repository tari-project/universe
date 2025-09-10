import { ChangeEvent } from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import RadioButton from '@app/components/elements/inputs/RadioButton.tsx';

import { FieldQuestion, FieldQuestions } from './helpers.ts';
import { Description } from './surveyForm.styles.ts';

export function RadioFields() {
    const { control, setValue, getValues } = useFormContext<FieldQuestions>();
    const { fields: radioFields } = useFieldArray({ control, name: 'radio' });

    function validate(required, fieldName) {
        if (!required) return true;
        const val = getValues(fieldName);
        return val.options?.some((c) => c.checked);
    }
    return radioFields.map((q, i) => {
        return (
            <Controller
                key={q.id}
                control={control}
                rules={{ required: q.isRequired, validate: () => validate(q.isRequired, `radio.${i}`) }}
                name={`radio.${i}`}
                render={({ field }) => {
                    const options = field.value.options || [];
                    return (
                        <>
                            <Description>{q.questionText}</Description>
                            {options?.map((o) => {
                                function handleChange(e: ChangeEvent<HTMLInputElement>) {
                                    const { id, checked: newChecked } = e.target;
                                    if (newChecked) {
                                        const updatedFieldValue: FieldQuestion = {
                                            ...field.value,
                                            options: options.map((opt) => ({ ...opt, checked: id === opt.id })),
                                        };
                                        setValue(field.name, updatedFieldValue, { shouldValidate: true });
                                    }
                                }

                                return (
                                    <RadioButton
                                        id={o.id}
                                        key={o.id}
                                        label={o.optionText}
                                        onChange={handleChange}
                                        value={o.value || ''}
                                        checked={!!o.checked}
                                    />
                                );
                            })}
                        </>
                    );
                }}
            />
        );
    });
}
