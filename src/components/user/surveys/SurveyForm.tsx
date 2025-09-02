import { CheckboxWrapper, Form } from './styles.ts';
import { SurveyQuestion } from '@app/types/user/surveys.ts';
import { Controller, useFieldArray, useForm } from 'react-hook-form';

interface SurveyFormProps {
    questions: SurveyQuestion[];
}

type Question = Pick<SurveyQuestion, 'id' | 'questionText' | 'questionType'>;
interface QuestionFields {
    question: Question[];
}
export default function SurveyForm({ questions }: SurveyFormProps) {
    const { control } = useForm<QuestionFields>({ defaultValues: { question: questions } });
    const { fields } = useFieldArray({
        control,
        name: 'question',
    });

    const fieldMarkup = fields.map((q, i) => {
        return (
            <Controller
                control={control}
                key={q.id}
                name={`question.${i}.questionText`}
                render={({ field }) => {
                    console.debug(q.questionText, q.questionType);
                    return (
                        <CheckboxWrapper>
                            <label htmlFor={field.name}>{field.value}</label>
                            <input type={q.questionType} checked={false} />
                        </CheckboxWrapper>
                    );
                }}
            />
        );
    });

    return <Form>{fieldMarkup}</Form>;
}
