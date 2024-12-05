import { useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { CardComponent } from '@app/containers/floating/Settings/components/Card.component';
import { CardContainer } from '@app/containers/floating/Settings/components/Settings.styles';
import { SettingsGroupWrapper } from '@app/containers/floating/Settings/components/SettingsGroup.styles';

import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useP2poolStatsStore } from '@app/store/useP2poolStatsStore';
import { Tbody, Thead, Th, Tr, Td } from './P2PoolStats.styles.ts';
import PeerTable from './PeerTable.tsx';
import { Divider } from '@app/components/elements/Divider.tsx';

function timeAgo(timestamp = 0) {
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const secondsAgo = now - timestamp;

    if (secondsAgo < 60) {
        return `${secondsAgo} secs ago`;
    } else if (secondsAgo < 3600) {
        const minutesAgo = Math.floor(secondsAgo / 60);
        return `${minutesAgo} min${minutesAgo !== 1 ? 's' : ''} ago`;
    } else if (secondsAgo < 86400) {
        const hoursAgo = Math.floor(secondsAgo / 3600);
        return `${hoursAgo} hr${hoursAgo !== 1 ? 's' : ''} ago`;
    } else {
        const daysAgo = Math.floor(secondsAgo / 86400);
        return `${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`;
    }
}

const P2PoolStats = () => {
    const { t } = useTranslation('p2p', { useSuspense: false });
    const connectedSince = useP2poolStatsStore((s) => s.connected_since);
    const connectionInfo = useP2poolStatsStore((s) => s.connection_info);
    const sha3Stats = useP2poolStatsStore((s) => s?.sha3x_stats);
    const randomXStats = useP2poolStatsStore((s) => s?.randomx_stats);
    const peers = useP2poolStatsStore((s) => s?.peers);
    const fetchP2pStats = useP2poolStatsStore((s) => s?.fetchP2poolStats);
    const fetchP2poolConnections = useP2poolStatsStore((s) => s?.fetchP2poolConnections);

    useEffect(() => {
        const fetchP2pStatsInterval = setInterval(async () => {
            await fetchP2pStats();
            await fetchP2poolConnections();
        }, 5000);

        return () => {
            clearInterval(fetchP2pStatsInterval);
        };
    }, [fetchP2pStats, fetchP2poolConnections]);

    return (
        <SettingsGroupWrapper>
            <Stack>
                <Typography variant="h6">{t('p2pool-stats')}</Typography>
                <CardContainer>
                    <CardComponent
                        heading={t('listener-addresses')}
                        labels={
                            connectionInfo?.listener_addresses?.map((addr, i) => ({
                                labelText: `#${i + 1}`,
                                labelValue: addr,
                            })) || []
                        }
                    />
                </CardContainer>
                <CardContainer>
                    <CardComponent
                        heading={t('p2pool-connection-info')}
                        labels={[
                            {
                                labelText: 'connected since',
                                labelValue: connectedSince || '-',
                            },
                            {
                                labelText: 'connected peers',
                                labelValue: connectionInfo?.connected_peers || '-',
                            },
                        ]}
                    />

                    <CardComponent
                        heading={t('network-info')}
                        labels={[
                            {
                                labelText: 'peers number',
                                labelValue: connectionInfo?.network_info?.num_peers || '-',
                            },
                            {
                                labelText: 'pending incoming',
                                labelValue: connectionInfo?.network_info?.connection_counters?.pending_incoming || '-',
                            },
                            {
                                labelText: 'pending outgoing',
                                labelValue: connectionInfo?.network_info?.connection_counters?.pending_outgoing || '-',
                            },
                            {
                                labelText: 'established incoming',
                                labelValue:
                                    connectionInfo?.network_info?.connection_counters?.established_incoming || '-',
                            },
                            {
                                labelText: 'established outgoing',
                                labelValue:
                                    connectionInfo?.network_info?.connection_counters?.established_outgoing || '-',
                            },
                        ]}
                    />
                    <CardComponent
                        heading={t('sha3-stats')}
                        labels={Object.entries(sha3Stats || {}).map(([key, value]) => ({
                            labelText: key.replace('_', ' '),
                            labelValue: value,
                        }))}
                    />
                    <CardComponent
                        heading={t('randomx-stats')}
                        labels={Object.entries(randomXStats || {}).map(([key, value]) => ({
                            labelText: key.replace('_', ' '),
                            labelValue: value,
                        }))}
                    />
                </CardContainer>
            </Stack>
            <Divider />
            {peers ? <PeerTable peers={peers} /> : null}
            <Divider />
            <Stack>
                <Typography variant="h6">{t('p2pool-peers')}</Typography>
                {Number(peers?.length) > 0 && (
                    <table>
                        <Thead>
                            <Tr>
                                <Th>
                                    <Typography>
                                        <Trans>#</Trans>
                                    </Typography>
                                </Th>
                                <Th>
                                    <Typography>
                                        <Trans>id</Trans>
                                    </Typography>
                                </Th>
                                <Th>
                                    <Typography>
                                        <Trans>randomx height</Trans>
                                    </Typography>
                                </Th>
                                <Th>
                                    <Typography>
                                        <Trans>sha3x height</Trans>
                                    </Typography>
                                </Th>
                                <Th>
                                    <Typography>
                                        <Trans>last ping</Trans>
                                    </Typography>
                                </Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {peers?.map((peer, index) => (
                                <Tr key={peer.peer_id}>
                                    <Td>
                                        <Typography>{index + 1}</Typography>
                                    </Td>
                                    <Td>
                                        <Typography>{peer.peer_id || '-'}</Typography>
                                    </Td>
                                    <Td>
                                        <Typography>{peer.peer_info?.current_random_x_height || '-'}</Typography>
                                    </Td>
                                    <Td>
                                        <Typography>{peer.peer_info?.current_sha3x_height || '-'}</Typography>
                                    </Td>
                                    <Td>
                                        <Typography>{peer.last_ping ? timeAgo(+peer.last_ping) : '-'}</Typography>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </table>
                )}
            </Stack>
        </SettingsGroupWrapper>
    );
};

export default P2PoolStats;
