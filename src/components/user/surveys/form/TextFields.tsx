import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { FieldQuestions } from './helpers.ts';
import { TextItem, TextItemLabel } from './surveyForm.styles.ts';

export function TextFields() {
    const { control } = useFormContext<FieldQuestions>();
    const { fields: textFields } = useFieldArray({ control, name: 'text' });

    return textFields.map((q, i) => {
        return (
            <Controller
                key={q.id}
                control={control}
                name={`text.${i}.value`}
                rules={{ required: q.isRequired }}
                render={({ field }) => {
                    return (
                        <>
                            <TextItemLabel htmlFor={field.name}>
                                {q.questionText} {!q.isRequired && <span>{`(optional)`}</span>}
                            </TextItemLabel>
                            <TextItem
                                {...field}
                                placeholder={`Add any other details here`}
                                variant="secondary"
                                rows={1}
                            />
                        </>
                    );
                }}
            />
        );
    });
}
