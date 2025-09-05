import { SurveyType } from '@app/types/user/surveys.ts';
import { useFetchSurveyContent } from '@app/hooks/user/surveys/useFetchSurveyContent.ts';
import { Chip } from '@app/components/elements/Chip.tsx';
import LoadingDots from '@app/components/elements/loaders/LoadingDots.tsx';
import SurveyForm from './form/SurveyForm.tsx';

import { ChipText, Title, Wrapper } from './styles.ts';
import { invoke } from '@tauri-apps/api/core';
import { setEarlyClosedDismissed } from '@app/store/stores/userFeedbackStore.ts';
import { useConfigUIStore } from '@app/store';
import { FeedbackPrompts } from '@app/types/configs.ts';

interface UserSurveyProps {
    type: SurveyType;
    onClose: () => void;
}
export default function UserSurvey({ type, onClose }: UserSurveyProps) {
    const { data: survey, isLoading } = useFetchSurveyContent(type);
    const loadingMarkup = isLoading && <LoadingDots />;

    const handleFeedback = (skipped: boolean) => {
        if (type === 'test') return;
        const feedbackType = type === 'long' ? 'long_time_miner' : 'early_close';
        invoke('set_feedback_fields', {
            feedbackType,
            wasSent: !skipped,
        }).then(() => {
            const updated = {
                [feedbackType]: {
                    feedback_sent: !skipped,
                    last_dismissed: Date.now(),
                },
            } as FeedbackPrompts;
            useConfigUIStore.setState((c) => ({ ...c, feedback: { ...c.feedback, ...updated } }));
            onClose();

            if (type === 'close') {
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
            <Chip size="large">
                <ChipText>{`Feedback`}</ChipText>
            </Chip>
            {loadingMarkup}
            {markup}
        </Wrapper>
    );
}
