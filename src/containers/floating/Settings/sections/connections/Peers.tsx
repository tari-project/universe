import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import { useMiningStore } from '@app/store/useMiningStore.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';

import {
    SettingsGroup,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles.ts';

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
    const connectedPeers = useMiningStore((state) => state.base_node?.connected_peers || []);
    const connectedPeersCount = connectedPeers?.length || 0;
    const listMarkup = connectedPeersCount
        ? connectedPeers.map((peer, i) => <li key={`peer-${peer}:${i}`}>{peer}</li>)
        : null;
    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('connected-peers')}</Typography>
                        {connectedPeersCount ? (
                            <Count $count={connectedPeersCount}>
                                <Typography>{connectedPeersCount}</Typography>
                            </Count>
                        ) : null}
                    </SettingsGroupTitle>

                    <Stack style={{ fontSize: '12px' }}>
                        <ol>{listMarkup}</ol>
                    </Stack>
                </SettingsGroupContent>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}
