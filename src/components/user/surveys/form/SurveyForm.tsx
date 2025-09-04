import { FormProvider, useForm } from 'react-hook-form';
import { Survey } from '@app/types/user/surveys.ts';

import { Typography } from '@app/components/elements/Typography.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { TextButton } from '@app/components/elements/buttons/TextButton.tsx';

import { FieldQuestions, getFieldTypes, parseAnswers } from './helpers.ts';
import { CTAWrapper, Form, FormContent } from './surveyForm.styles.ts';
import { CheckboxFields } from './CheckboxFields.tsx';
import { RadioFields } from './RadioFields.tsx';
import { TextFields } from './TextFields.tsx';
import { useAirdropStore, useConfigCoreStore } from '@app/store';
import { useSendFeedback } from '@app/hooks/user/surveys/useSendFeedback.ts';

interface SurveyFormProps {
    surveyContent: Survey;
    onSkipped?: () => void;
}

export default function SurveyForm({ surveyContent, onSkipped }: SurveyFormProps) {
    const appId = useConfigCoreStore((s) => s.anon_id);
    const userId = useAirdropStore((s) => s.userDetails?.user.id);
    const defaultValues = getFieldTypes(surveyContent.questions || []);
    const methods = useForm<FieldQuestions>({ defaultValues });

    const { mutate } = useSendFeedback();

    function handleSubmit(data: FieldQuestions) {
        const answers = parseAnswers(data);
        const metadata = {
            appId,
            userId,
        };

        mutate({
            slug: surveyContent.slug,
            feedbackBody: {
                answers,
                metadata,
            },
        });
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
                    <TextButton size="large" type="reset" onClick={onSkipped}>
                        <Typography>{`Skip for now`}</Typography>
                    </TextButton>
                </CTAWrapper>
            </Form>
        </FormProvider>
    );
}
