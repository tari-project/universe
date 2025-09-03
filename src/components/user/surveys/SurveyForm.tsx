import { Controller, useFieldArray, useForm } from 'react-hook-form';

import { Survey, SurveyQuestion, SurveyQuestionOption } from '@app/types/user/surveys.ts';
import { Checkbox } from '@app/components/elements/inputs/Checkbox.tsx';
import { TextButton } from '@app/components/elements/buttons/TextButton.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import {
    CTAWrapper,
    Description,
    Form,
    FormContent,
    ItemWrapper,
    TextItem,
    TextItemLabel,
} from './surveyForm.styles.ts';

interface SurveyFormProps {
    surveyContent: Survey;
}
type CheckOpt = SurveyQuestionOption & { checked: boolean };
interface QuestionFields {
    textQuestions: SurveyQuestion[];
    checkOptions: CheckOpt[];
}

export default function SurveyForm({ surveyContent }: SurveyFormProps) {
    const checkOptions = surveyContent.questions
        ?.filter((q) => q.questionType === 'checkbox')
        .flatMap((q) => q.options)
        .map((o) => ({ ...o, checked: false }));

    const textQuestions = surveyContent.questions
        ?.filter((q) => q.questionType === 'text')
        .map((q) => ({ ...q, value: '' }));

    const { control, setValue, handleSubmit } = useForm<QuestionFields>({
        defaultValues: { textQuestions, checkOptions },
    });
    const { fields: textFields } = useFieldArray({ control, name: 'textQuestions' });
    const { fields: checkFields } = useFieldArray({ control, name: 'checkOptions' });

    function parseData(_data: QuestionFields) {
        console.debug(`_data= `, _data);
    }

    const fieldMarkup = textFields.map((q, i) => {
        return (
            <Controller
                control={control}
                key={q.id}
                name={`textQuestions.${i}.value`}
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

    const checks = checkFields.map((q, i) => {
        return (
            <Controller
                control={control}
                key={q.id}
                name={`checkOptions.${i}.checked`}
                render={({ field }) => {
                    function handleChange(value: boolean) {
                        setValue(field.name, value);
                    }

                    return (
                        <ItemWrapper key={q.id}>
                            <Checkbox
                                id={field.name}
                                labelText={q.optionText}
                                checked={field.value}
                                handleChange={handleChange}
                            />
                        </ItemWrapper>
                    );
                }}
            />
        );
    });

    return (
        <Form onSubmit={handleSubmit(parseData)}>
            <FormContent>
                {checks}
                {fieldMarkup}
            </FormContent>
            <CTAWrapper>
                <Button type="submit" fluid size="xlarge" variant="black">{`Send Feedback`}</Button>
                <TextButton size="large" type="reset">
                    <Typography>{`Skip for now`}</Typography>
                </TextButton>
            </CTAWrapper>
        </Form>
    );
}
