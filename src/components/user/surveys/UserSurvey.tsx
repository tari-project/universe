import { SurveyType } from '@app/types/user/surveys.ts';
import { useFetchSurveyContent } from '@app/hooks/user/surveys/useFetchSurveyContent.ts';
import { Chip } from '@app/components/elements/Chip.tsx';
import LoadingDots from '@app/components/elements/loaders/LoadingDots.tsx';
import SurveyForm from './form/SurveyForm.tsx';

import { ChipText, ChipWrapper, Title, Wrapper } from './styles.ts';
import { invoke } from '@tauri-apps/api/core';
import { setEarlyClosedDismissed } from '@app/store/stores/userFeedbackStore.ts';
import { useConfigUIStore } from '@app/store';
import { FeedbackPrompts } from '@app/types/configs.ts';
import { useTranslation } from 'react-i18next';

interface UserSurveyProps {
    type: SurveyType;
    onClose: () => void;
}
export default function UserSurvey({ type, onClose }: UserSurveyProps) {
    const { t } = useTranslation('user');
    const { data: survey, isLoading } = useFetchSurveyContent(type);
    const loadingMarkup = isLoading && <LoadingDots />;

    const handleFeedback = (skipped: boolean) => {
        const feedbackType = type === 'long' ? 'long_time_miner' : 'early_close';
        const payload = { feedbackType, wasSent: !skipped };

        invoke('set_feedback_fields', payload).then(() => {
            useConfigUIStore.setState((c) => {
                const updated = {
                    [feedbackType]: {
                        ...c?.feedback?.[feedbackType],
                        feedback_sent: !skipped,
                        last_dismissed: { timestamp: Date.now() },
                    },
                } as FeedbackPrompts;

                return { ...c, feedback: { ...c.feedback, ...updated } };
            });

            onClose();
            if (type === 'close') {
                if (skipped) {
                    console.info(`[early-close] feedback dismissed.`);
                }
                setEarlyClosedDismissed(true);
            }
        });
    };

    const handleSkip = () => handleFeedback(true);
    const handleSubmit = () => handleFeedback(false);

    const markup = !!survey && (
        <>
            <Title variant="h1">{survey.description}</Title>
            {survey.questions && <SurveyForm surveyContent={survey} onSkipped={handleSkip} onSuccess={handleSubmit} />}
        </>
    );

    return (
        <Wrapper>
            <ChipWrapper>
                <Chip size="large">
                    <ChipText>{t('feedback.chip_text')}</ChipText>
                </Chip>
            </ChipWrapper>
            {loadingMarkup}
            {markup}
        </Wrapper>
    );
}
