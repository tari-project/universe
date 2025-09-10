import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { FieldQuestions } from './helpers.ts';
import { TextItem, TextItemLabel } from './surveyForm.styles.ts';
import { useTranslation } from 'react-i18next';

export function TextFields() {
    const { t } = useTranslation('user');
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
                                {q.questionText} {!q.isRequired && <span>{t('feedback.optional_label')}</span>}
                            </TextItemLabel>
                            <TextItem
                                {...field}
                                placeholder={t('feedback.text_placeholder')}
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
