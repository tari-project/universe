import { Controller, useFieldArray, useForm } from 'react-hook-form';

import { SurveyAnswerInput, SurveyQuestion } from '@app/types/user/surveys.ts';
import { Checkbox } from '@app/components/elements/inputs/Checkbox.tsx';
import { TextButton } from '@app/components/elements/buttons/TextButton.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { CTAWrapper, Form, FormContent, ItemWrapper, TextItem, TextItemLabel } from './surveyForm.styles.ts';
import { useConfigCoreStore } from '@app/store';
import { useSendFeedback } from '@app/hooks/user/surveys/useSendFeedback.ts';

interface SurveyFormProps {
    questions: SurveyQuestion[];
}

type Question = Pick<SurveyQuestion, 'id' | 'questionText' | 'questionType'> & {
    checked: boolean;
    value?: string;
};
interface QuestionFields {
    questionField: Question[];
}
export default function SurveyForm({ questions }: SurveyFormProps) {
    const anon_id = useConfigCoreStore((s) => s.anon_id);
    const { mutate } = useSendFeedback();
    const defaultValues = questions.map((q) => ({ ...q, checked: false, value: '' }));
    const { control, setValue, watch, handleSubmit } = useForm<QuestionFields>({
        defaultValues: { questionField: defaultValues },
    });
    const { fields } = useFieldArray({
        control,
        name: 'questionField',
    });

    const watchedField = watch('questionField');
    function parseData(_data: QuestionFields) {
        const answers = watchedField.map((f) => {
            if (f.questionType === 'text') {
                return {
                    questionId: f.id,
                    answerText: f.value,
                };
            }

            if (f.questionType === 'checkbox') {
                const selectedOptionIds = f.checked ? [f.id] : [];
                return {
                    questionId: f.id,
                    selectedOptionIds,
                };
            }
        }) as SurveyAnswerInput[];

        const metadata = {
            userId: anon_id,
            appId: anon_id,
            operatingSystem: 'string',
            universeVersion: 'string',
            network: 'string',
            mode: 'string',
            extraData: {},
        };

        mutate({
            slug: 'survey-close',
            feedbackBody: {
                answers,
                metadata,
            },
        });
    }

    const fieldMarkup = fields.map((q, i) => {
        if (q.questionType === 'checkbox') {
            return (
                <Controller
                    control={control}
                    key={q.id}
                    name={`questionField.${i}.checked`}
                    render={({ field }) => {
                        function handleChange(value: boolean) {
                            setValue(field.name, value);
                        }
                        return (
                            <ItemWrapper>
                                <Checkbox
                                    {...field}
                                    id={field.name}
                                    labelText={q.questionText}
                                    checked={field.value}
                                    handleChange={handleChange}
                                />
                            </ItemWrapper>
                        );
                    }}
                />
            );
        }

        return (
            <Controller
                control={control}
                key={q.id}
                name={`questionField.${i}.value`}
                render={({ field }) => {
                    return (
                        <>
                            <TextItemLabel htmlFor={field.name}>
                                {q.questionText} <span>{`(optional)`}</span>
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

    return (
        <Form onSubmit={handleSubmit(parseData)}>
            <FormContent>{fieldMarkup}</FormContent>
            <CTAWrapper>
                <Button type="submit" fluid size="xlarge" variant="black">{`Send Feedback`}</Button>
                <TextButton size="large" type="reset">
                    <Typography>{`Skip for now`}</Typography>
                </TextButton>
            </CTAWrapper>
        </Form>
    );
}
