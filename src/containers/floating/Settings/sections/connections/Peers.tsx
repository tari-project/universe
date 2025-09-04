import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';

import {
    SettingsGroup,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles.ts';
import { useNodeStore } from '@app/store/useNodeStore.ts';
import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

const Count = styled.div<{ $count: number }>`
    border-radius: 11px;
    background-color: ${({ theme }) => theme.palette.background.accent};
    color: ${({ theme }) => theme.palette.text.primary};
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px 6px;
    line-height: 1;
    width: ${({ $count }) => ($count > 999 ? 'auto' : '22px')};
    height: ${({ $count }) => ($count > 999 ? 'auto' : '22px')};
    font-size: ${({ $count }) => ($count > 999 ? '10px' : '11px')};
`;

export default function Peers() {
    const { t } = useTranslation('settings');
    const isConnectedToTariNetwork = useNodeStore((state) => state.isNodeConnected);
    const nodeIdentity = useNodeStore((state) => state.node_identity);
    const baseNodeStatus = useNodeStore((state) => state.base_node_status);
    const nodeType = useNodeStore((state) => state.node_type);
    const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
    const listMarkup = connectedPeers.map((peer, i) => <li key={`peer-${peer}:${i}`}>{peer}</li>);

    useEffect(() => {
        invoke('list_connected_peers').then((peers) => setConnectedPeers(peers));
    }, [nodeIdentity?.public_key, baseNodeStatus?.num_connections]);

    useEffect(() => {
        setConnectedPeers([]);
    }, [nodeType]);

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('connected-peers')}</Typography>
                        {connectedPeers?.length ? (
                            <Count $count={connectedPeers.length}>
                                <Typography>{connectedPeers.length}</Typography>
                            </Count>
                        ) : null}
                    </SettingsGroupTitle>

                    <Stack style={{ fontSize: '12px' }}>
                        {connectedPeers?.length ? (
                            <ol>{listMarkup}</ol>
                        ) : (
                            <p>{isConnectedToTariNetwork ? '-' : t('not-connected-to-tari')}</p>
                        )}
                    </Stack>
                </SettingsGroupContent>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}
