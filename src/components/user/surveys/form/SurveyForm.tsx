import { FormProvider, useForm } from 'react-hook-form';
import { Survey } from '@app/types/user/surveys.ts';

import { Typography } from '@app/components/elements/Typography.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { TextButton } from '@app/components/elements/buttons/TextButton.tsx';

import { FieldQuestions, getFieldTypes, parseResponse } from './helpers.ts';
import { CTAWrapper, Form, FormContent } from './surveyForm.styles.ts';
import { CheckboxFields } from './CheckboxFields.tsx';
import { RadioFields } from './RadioFields.tsx';
import { TextFields } from './TextFields.tsx';

interface SurveyFormProps {
    surveyContent: Survey;
}

export default function SurveyForm({ surveyContent }: SurveyFormProps) {
    const defaultValues = getFieldTypes(surveyContent.questions || []);
    const methods = useForm<FieldQuestions>({ defaultValues });

    function handleSubmit(data: FieldQuestions) {
        parseResponse(data);
    }
    return (
        <FormProvider {...methods}>
            <Form onSubmit={methods.handleSubmit(handleSubmit)}>
                <FormContent>
                    <RadioFields />
                    <TextFields />
                    <CheckboxFields />
                </FormContent>
                <CTAWrapper>
                    <Button type="submit" fluid size="xlarge" variant="black">{`Send Feedback`}</Button>
                    <TextButton size="large" type="reset">
                        <Typography>{`Skip for now`}</Typography>
                    </TextButton>
                </CTAWrapper>
            </Form>
        </FormProvider>
    );
}
