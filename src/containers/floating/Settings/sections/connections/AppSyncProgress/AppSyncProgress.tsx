import { CircularProgress } from '@app/components/elements/CircularProgress';
import { ProgressWrapper, Text, TextWrapper, Title, Wrapper } from './styles';
import { useTranslation } from 'react-i18next';
import useSync from '@app/hooks/app/useSyncProgress.ts';

export const AppSyncProgress = () => {
    const { t } = useTranslation('setup-progresses');
    const { getProgress, setupPhaseTitle, setupTitle, setupParams } = useSync();
    const { progress: stageProgress, total: stageTotal } = getProgress();

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
