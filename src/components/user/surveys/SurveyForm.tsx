import { SurveyQuestion } from '@app/types/user/surveys.ts';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Checkbox } from '@app/components/elements/inputs/Checkbox.tsx';
import { CheckboxWrapper, Form, TextboxWrapper } from './styles.ts';

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
    const defaultValues = questions.map((q) => ({ ...q, checked: false, value: '' }));
    const { control } = useForm<QuestionFields>({ defaultValues: { questionField: defaultValues } });
    const { fields } = useFieldArray({
        control,
        name: 'questionField',
    });

    const fieldMarkup = fields.map((q, i) => {
        if (q.questionType === 'checkbox') {
            return (
                <Controller
                    control={control}
                    key={q.id}
                    name={`questionField.${i}.checked`}
                    render={({ field }) => {
                        return (
                            <CheckboxWrapper>
                                <Checkbox {...field} labelText={q.questionText} checked={field.value} />
                            </CheckboxWrapper>
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
                    console.debug(field);
                    return (
                        <TextboxWrapper>
                            <label htmlFor={field.name}>{q.questionText}</label>
                            <input {...field} />
                        </TextboxWrapper>
                    );
                }}
            />
        );
    });

    return <Form>{fieldMarkup}</Form>;
}
