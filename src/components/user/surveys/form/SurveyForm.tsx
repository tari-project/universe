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

import { useSendFeedback } from '@app/hooks/user/surveys/useSendFeedback.ts';
import { useTranslation } from 'react-i18next';

interface SurveyFormProps {
    surveyContent: Survey;
    onSkipped?: () => void;
    onSuccess?: () => void;
}

export default function SurveyForm({ surveyContent, onSkipped, onSuccess }: SurveyFormProps) {
    const { t } = useTranslation(['user', 'common']);
    const { mutateAsync } = useSendFeedback();
    const defaultValues = getFieldTypes(surveyContent.questions || []);
    const methods = useForm<FieldQuestions>({ defaultValues });
    const isValid = methods.formState.isValid;

    function handleSubmit(data: FieldQuestions) {
        const answers = parseAnswers(data);
        mutateAsync({ slug: surveyContent.slug, feedbackBody: { answers } })
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
                    <Button type="submit" fluid size="xlarge" variant="black" disabled={!isValid}>
                        {t('feedback.submit_cta')}
                    </Button>

                    <TextButton size="large" type="reset" onClick={onSkipped}>
                        <Typography variant="h5">{t('common:skip-for-now')}</Typography>
                    </TextButton>
                </CTAWrapper>
            </Form>
        </FormProvider>
    );
}
