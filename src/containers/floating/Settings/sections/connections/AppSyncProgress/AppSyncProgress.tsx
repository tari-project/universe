import { CircularProgress } from '@app/components/elements/CircularProgress';
import { ProgressWrapper, Text, TextWrapper, Title, Wrapper } from './styles';
import { useTranslation } from 'react-i18next';
import useSync from '@app/hooks/app/useSyncProgress.ts';

export const AppSyncProgress = () => {
    const { t } = useTranslation('setup-progresses');
    const { getCurrentPhase, getProgress } = useSync();

    const currentPhaseToShow = getCurrentPhase();

    const { progress: stageProgress, total: stageTotal } = getProgress();

    const setupPhaseTitle = currentPhaseToShow?.phase_title;
    const setupTitle = currentPhaseToShow?.title;
    const setupParams = currentPhaseToShow?.title_params ? { ...currentPhaseToShow.title_params } : {};
    console.debug(currentPhaseToShow);
    return (
        <Wrapper>
            <TextWrapper>
                <Title>{t(`phase-title.${setupPhaseTitle}`)}</Title>
                <Text>{t(`title.${setupTitle}`, { ...setupParams })}</Text>
            </TextWrapper>
            <ProgressWrapper>
                <Title>
                    {stageProgress} / {stageTotal}
                </Title>
                <CircularProgress />
            </ProgressWrapper>
        </Wrapper>
    );
};
