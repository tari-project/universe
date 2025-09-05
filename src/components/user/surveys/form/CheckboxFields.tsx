import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { Checkbox } from '@app/components/elements/inputs/Checkbox.tsx';
import { FieldQuestions } from './helpers.ts';
import { Description, ItemWrapper } from './surveyForm.styles.ts';

export function CheckboxFields() {
    const { control, setValue } = useFormContext<FieldQuestions>();
    const { fields: checkFields } = useFieldArray({ control, name: 'checkbox' });

    return checkFields.map((q, i) => {
        const shouldRenderQuestionText = q.questionId !== checkFields[i - 1]?.questionId;
        return (
            <Controller
                control={control}
                key={q.id}
                name={`checkbox.${i}.checked`}
                render={({ field }) => {
                    function handleChange(value: boolean) {
                        setValue(field.name, value);
                    }
                    return (
                        <>
                            {shouldRenderQuestionText && <Description>{q.questionText}</Description>}
                            <ItemWrapper key={q.id}>
                                <Checkbox
                                    id={field.name}
                                    labelText={q.optionText}
                                    checked={field.value}
                                    handleChange={handleChange}
                                />
                            </ItemWrapper>
                        </>
                    );
                }}
            />
        );
    });
}
