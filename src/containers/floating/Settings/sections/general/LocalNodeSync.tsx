import { useTranslation } from 'react-i18next';
import { memo, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { useNodeStore } from '@app/store/useNodeStore.ts';
import { SettingsGroupWrapper } from '@app/containers/floating/Settings/components/SettingsGroup.styles.ts';

const SyncWrapper = styled.div`
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    border: 1px solid ${({ theme }) => theme.palette.divider};
    padding: 20px;
    display: flex;
    align-items: center;
    flex-direction: row;
    background-color: ${({ theme }) => theme.colorsAlpha.darkAlpha[10]};
    justify-content: space-between;
`;

const InfoWrapper = styled.div`
    display: flex;
    flex-direction: column;

    p {
        color: ${({ theme }) => theme.palette.text.secondary};
    }
`;

const ProgressWrapper = styled.div`
    display: flex;
    align-items: center;
    flex-direction: row;
`;

interface Progress {
    current?: number;
    required?: number;
}

interface HeightProgress {
    header?: { local?: number; tip?: number };
    block?: { local?: number; tip?: number };
}
const LocalNodeSync = memo(function LocalNodeSync() {
    const { t } = useTranslation('setup-progresses');
    const lastUpdate = useNodeStore((s) => s.backgroundNodeSyncLastUpdate);
    const node_type = useNodeStore((s) => s.node_type);
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

    if (node_type !== 'RemoteUntilLocal') return null;
    return (
        <SettingsGroupWrapper>
            <SyncWrapper>
                <InfoWrapper>
                    <Typography variant="h6">{t('local-node-sync')}</Typography>
                    {title && <Typography variant="p">{`${title}...`}</Typography>}
                </InfoWrapper>
                <ProgressWrapper>
                    {peerProgressMarkup}
                    {headerProgress}
                    {blockProgress}
                    <CircularProgress />
                </ProgressWrapper>
            </SyncWrapper>
        </SettingsGroupWrapper>
    );
});

export default LocalNodeSync;
