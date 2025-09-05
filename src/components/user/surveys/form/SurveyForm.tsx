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
    onSuccess?: () => void;
}

export default function SurveyForm({ surveyContent, onSkipped, onSuccess }: SurveyFormProps) {
    const appId = useConfigCoreStore((s) => s.anon_id);
    const userId = useAirdropStore((s) => s.userDetails?.user.id);
    const defaultValues = getFieldTypes(surveyContent.questions || []);
    const methods = useForm<FieldQuestions>({ defaultValues });

    const { mutateAsync } = useSendFeedback();

    function handleSubmit(data: FieldQuestions) {
        const answers = parseAnswers(data);
        const metadata = { appId, userId }; // TODO - add other metadata
        mutateAsync({ slug: surveyContent.slug, feedbackBody: { answers, metadata } })
            .then(() => onSuccess?.())
            .catch((err) => console.error(err));
    }
    return (
        <FormProvider {...methods}>
            <Form onSubmit={methods.handleSubmit(handleSubmit)}>
                <FormContent>
                    <CheckboxFields />
                    <RadioFields />
                    <TextFields />
                </FormContent>
                <CTAWrapper>
                    <Button type="submit" fluid size="xlarge" variant="black">{`Send Feedback`}</Button>
                    <TextButton
                        size="large"
                        type="reset"
                        onClick={() => {
                            console.debug('clicked skip');
                            onSkipped?.();
                        }}
                    >
                        <Typography>{`Skip for now`}</Typography>
                    </TextButton>
                </CTAWrapper>
            </Form>
        </FormProvider>
    );
}
