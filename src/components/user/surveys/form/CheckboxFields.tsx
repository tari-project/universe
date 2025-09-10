import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { Checkbox } from '@app/components/elements/inputs/Checkbox.tsx';
import { FieldQuestions } from './helpers.ts';
import { Description, ItemWrapper } from './surveyForm.styles.ts';

export function CheckboxFields() {
    const { control, setValue, watch } = useFormContext<FieldQuestions>();
    const { fields: checkFields } = useFieldArray({ control, name: 'checkbox' });
    const watched = watch('checkbox');
    const noneChecked = watched.every((c) => !c.checked);

    return checkFields.map((q, i) => {
        const shouldRenderQuestionText = q.questionId !== checkFields[i - 1]?.questionId;
        return (
            <Controller
                control={control}
                key={q.id}
                rules={{ required: q.isRequired ? noneChecked : false }}
                name={`checkbox.${i}.checked`}
                render={({ field }) => {
                    return (
                        <>
                            {shouldRenderQuestionText && <Description>{q.questionText}</Description>}
                            <ItemWrapper key={q.id}>
                                <Checkbox
                                    id={field.name}
                                    labelText={q.optionText}
                                    checked={field.value}
                                    handleChange={(value) => setValue(field.name, value, { shouldValidate: true })}
                                />
                            </ItemWrapper>
                        </>
                    );
                }}
            />
        );
    });
}
