import { useTranslation } from 'react-i18next';

import { Typography } from '@app/components/elements/Typography.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';

import {
    SettingsGroup,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles.ts';
import { NodeType, useNodeStore } from '@app/store/useNodeStore.ts';
import { BackgroundNodeSyncUpdatePayload } from '@app/types/events-payloads.ts';

export function BackgroundNodeSyncProgress({ lastUpdate }: { lastUpdate: BackgroundNodeSyncUpdatePayload }) {
    const { t } = useTranslation('setup-progresses', { useSuspense: false });
    if (!lastUpdate) return null;

    switch (lastUpdate.step) {
        case 'Startup':
            return (
                <Typography>
                    {t('title.waiting-for-initial-sync', {
                        initial_connected_peers: lastUpdate.initial_connected_peers,
                        required_peers: lastUpdate.required_peers,
                    })}
                </Typography>
            );
        case 'Header':
            return (
                <Typography>
                    {t('title.waiting-for-header-sync', {
                        local_header_height: lastUpdate.local_header_height,
                        tip_header_height: lastUpdate.tip_header_height,
                        local_block_height: lastUpdate.local_block_height,
                        tip_block_height: lastUpdate.tip_block_height,
                    })}
                </Typography>
            );
        case 'Block':
            return (
                <Typography>
                    {t('title.waiting-for-block-sync', {
                        local_header_height: lastUpdate.local_header_height,
                        tip_header_height: lastUpdate.tip_header_height,
                        local_block_height: lastUpdate.local_block_height,
                        tip_block_height: lastUpdate.tip_block_height,
                    })}
                </Typography>
            );
        default:
            return null;
    }
}

const getNodeType = (nodeType?: NodeType) => {
    if (!nodeType) return 'N/A';
    if (nodeType == 'LocalAfterRemote') return 'Local';
    if (nodeType == 'RemoteUntilLocal') return 'Remote';
    return nodeType;
};

export default function Node() {
    const { t } = useTranslation('settings', { useSuspense: false });
    const { node_type, node_identity, node_connection_address, backgroundNodeSyncLastUpdate } = useNodeStore();

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('minotari-node')}</Typography>
                    </SettingsGroupTitle>
                    <SettingsGroupContent>
                        <Stack direction="column" alignItems="flex-start">
                            <Stack direction="row">
                                <Typography>{t('node-type')}</Typography>
                                <Typography>
                                    <b>{getNodeType(node_type)}</b>
                                </Typography>
                            </Stack>
                            <Stack direction="row">
                                <Typography>{t('node-public-key')}</Typography>
                                <Typography>
                                    <b>{node_identity?.public_key || 'N/A'}</b>
                                </Typography>
                            </Stack>
                            <Stack direction="row">
                                <Typography>{t('node-public-address')}</Typography>
                                <Typography>
                                    <b>{node_identity?.public_address.join(', ') || 'N/A'}</b>
                                </Typography>
                            </Stack>
                            <Stack direction="row">
                                <Typography>{t('node-connection-address')}</Typography>
                                <Typography>
                                    <b>{node_connection_address || 'N/A'}</b>
                                </Typography>
                            </Stack>
                        </Stack>
                    </SettingsGroupContent>
                    {backgroundNodeSyncLastUpdate?.step && node_type == 'RemoteUntilLocal' && (
                        <SettingsGroupContent>
                            <Stack direction="column" alignItems="flex-start">
                                <Stack direction="row">
                                    <Typography>{t('local-node-sync-progress')}: </Typography>
                                    <b>
                                        <BackgroundNodeSyncProgress lastUpdate={backgroundNodeSyncLastUpdate} />
                                    </b>
                                </Stack>
                            </Stack>
                        </SettingsGroupContent>
                    )}
                </SettingsGroupContent>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}
