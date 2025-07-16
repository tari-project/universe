import { useTranslation } from 'react-i18next';
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { Wrapper, ProgressWrapper, Text, TextWrapper, Title } from './styles.ts';
import useSync from '@app/hooks/app/useSyncProgress.ts';
import { useNodeStore } from '@app/store/useNodeStore.ts';
import { SettingsGroupWrapper } from '@app/containers/floating/Settings/components/SettingsGroup.styles.ts';
import { LocalNode } from '@app/components/sync/LocalNode.tsx';

export function Sync() {
    const { t } = useTranslation('setup-progresses');
    const { getProgress, setupPhaseTitle, setupTitle, setupParams, showSync } = useSync();
    const { progress: stageProgress, total: stageTotal } = getProgress();

    const node_type = useNodeStore((s) => s.node_type);
    const isRemoteUntilLocal = node_type === 'RemoteUntilLocal';

    const generalSyncMarkup = showSync ? (
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
    ) : null;

    const syncMarkup = isRemoteUntilLocal ? <LocalNode /> : generalSyncMarkup;
    return showSync || isRemoteUntilLocal ? <SettingsGroupWrapper>{syncMarkup}</SettingsGroupWrapper> : null;
}
