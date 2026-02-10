import { useTranslation } from 'react-i18next';
import { useNodeStore } from '@app/store/useNodeStore.ts';
import { useEffect, useState } from 'react';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Wrapper, ProgressWrapper, Text, TextWrapper, Title } from './styles.ts';
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { SettingsGroupWrapper } from '@app/containers/floating/Settings/components/SettingsGroup.styles.ts';
interface Progress {
    current?: number;
    required?: number;
}

interface HeightProgress {
    header?: { local?: number; tip?: number };
    block?: { local?: number; tip?: number };
}
export function LocalNodeSync() {
    const { t } = useTranslation('setup-progresses');
    const lastUpdate = useNodeStore((s) => s.backgroundNodeSyncLastUpdate);
    const [titleKey, setTitleKey] = useState('');
    const [peerProgress, setPeerProgress] = useState<Progress | undefined>();
    const [heightProgress, setHeightProgress] = useState<HeightProgress | undefined>();

    useEffect(() => {
        if (!lastUpdate) return;
        switch (lastUpdate.step) {
            case 'Startup': {
                setTitleKey('network-peers');
                setPeerProgress({
                    current: lastUpdate.initial_connected_peers,
                    required: lastUpdate.required_peers,
                });
                break;
            }
            case 'Header': {
                setTitleKey('header-sync');
                setHeightProgress({
                    header: {
                        local: lastUpdate.local_header_height,
                        tip: lastUpdate.tip_header_height,
                    },
                });
                break;
            }
            case 'Block': {
                setTitleKey('block-sync');
                setHeightProgress({
                    block: {
                        local: lastUpdate.local_block_height,
                        tip: lastUpdate.tip_block_height,
                    },
                });
                break;
            }
        }
    }, [lastUpdate]);
    const title = titleKey ? t(titleKey) : null;

    const peerProgressMarkup =
        lastUpdate?.step === 'Startup' && peerProgress ? (
            <Typography variant="h6">{`${peerProgress.current}/${peerProgress.required}`}</Typography>
        ) : null;

    const headerProgress =
        lastUpdate?.step === 'Header' && heightProgress?.header ? (
            <Typography variant="h6">{`${heightProgress?.header.local}/${heightProgress?.header.tip}`}</Typography>
        ) : null;

    const blockProgress =
        lastUpdate?.step === 'Block' && heightProgress?.block ? (
            <Typography variant="h6">{`${heightProgress?.block.local}/${heightProgress?.block.tip}`}</Typography>
        ) : null;

    const isSynced = lastUpdate?.step === 'Done';

    if (isSynced || !lastUpdate) {
        return null;
    }
    return (
        <SettingsGroupWrapper>
            <Wrapper>
                <TextWrapper>
                    <Title>{t('local-node-sync')}</Title>
                    {title && <Text>{`${title}...`}</Text>}
                </TextWrapper>
                <ProgressWrapper>
                    {peerProgressMarkup}
                    {headerProgress}
                    {blockProgress}
                    <CircularProgress />
                </ProgressWrapper>
            </Wrapper>
        </SettingsGroupWrapper>
    );
}
