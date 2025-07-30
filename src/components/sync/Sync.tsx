import { useTranslation } from 'react-i18next';
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { Wrapper, ProgressWrapper, Text, TextWrapper, Title } from './styles.ts';
import useSync from '@app/hooks/app/useSyncProgress.ts';
import { useNodeStore } from '@app/store/useNodeStore.ts';
import { SettingsGroupWrapper } from '@app/containers/floating/Settings/components/SettingsGroup.styles.ts';
import { LocalNode } from '@app/components/sync/LocalNode.tsx';

export function Sync() {
    const { t } = useTranslation('setup-progresses');
    const { getProgress, setupPhaseTitle, setupTitle, setupParams, showSync, currentPhaseToShow } = useSync();
    const { progress: stageProgress, total: stageTotal } = getProgress();

    const node_type = useNodeStore((s) => s.node_type);
    const isRemoteUntilLocal = node_type === 'RemoteUntilLocal';

    const generalSyncMarkup =
        showSync && !!currentPhaseToShow ? (
            <SettingsGroupWrapper>
                <Wrapper>
                    <TextWrapper>
                        {setupPhaseTitle ? <Title>{t(`phase-title.${setupPhaseTitle}`)}</Title> : null}
                        {setupTitle ? <Text>{t(`title.${setupTitle}`, { ...setupParams })}</Text> : null}
                    </TextWrapper>
                    <ProgressWrapper>
                        <Title>
                            {stageProgress} / {stageTotal}
                        </Title>
                        <CircularProgress />
                    </ProgressWrapper>
                </Wrapper>
            </SettingsGroupWrapper>
        ) : null;

    const syncMarkup = isRemoteUntilLocal ? (
        <SettingsGroupWrapper>
            <LocalNode />
        </SettingsGroupWrapper>
    ) : (
        generalSyncMarkup
    );
    return showSync || isRemoteUntilLocal ? syncMarkup : null;
}
