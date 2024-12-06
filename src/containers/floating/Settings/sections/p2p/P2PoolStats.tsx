import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { CardComponent } from '@app/containers/floating/Settings/components/Card.component';
import { CardContainer } from '@app/containers/floating/Settings/components/Settings.styles';
import {
    SettingsGroupWrapper,
    SettingsGroupTitle,
} from '@app/containers/floating/Settings/components/SettingsGroup.styles';

import { Typography } from '@app/components/elements/Typography.tsx';
import { useP2poolStatsStore } from '@app/store/useP2poolStatsStore';
import PeerTable from './PeerTable.tsx';
import { Divider } from '@app/components/elements/Divider.tsx';
import { ConnectedPeerInfo } from '@app/types/app-status.ts';
import P2PConnectionData from './P2PConnectionData.tsx';

export type ConnectedPeerInfoExtended = ConnectedPeerInfo & {
    sha3WithinRange?: boolean;
    randomxWithinRange?: boolean;
};

const P2PoolStats = () => {
    const { t } = useTranslation('p2p', { useSuspense: false });
    const connectedSince = useP2poolStatsStore((s) => s?.connected_since);
    const connectionInfo = useP2poolStatsStore((s) => s?.connection_info);
    const sha3Stats = useP2poolStatsStore((s) => s?.sha3x_stats);
    const randomXStats = useP2poolStatsStore((s) => s?.randomx_stats);
    const peers = useP2poolStatsStore((s) => s?.peers);
    const fetchP2pStats = useP2poolStatsStore((s) => s?.fetchP2poolStats);
    const fetchP2poolConnections = useP2poolStatsStore((s) => s?.fetchP2poolConnections);

    useEffect(() => {
        const fetchP2pStatsInterval = setInterval(async () => {
            await fetchP2pStats?.();
            await fetchP2poolConnections();
        }, 5000);

        return () => {
            clearInterval(fetchP2pStatsInterval);
        };
    }, [fetchP2pStats, fetchP2poolConnections]);

    const displayPeers = useMemo(() => {
        const sha3Height = sha3Stats?.height;
        const randomXHeight = randomXStats?.height;
        return peers?.map((peer) => {
            const { current_sha3x_height, current_random_x_height } = peer.peer_info || {};
            const sha3WithinRange = sha3Height ? Math.abs(sha3Height - current_sha3x_height) <= 5 : undefined;
            const randomxWithinRange = randomXHeight
                ? Math.abs(randomXHeight - current_random_x_height) <= 5
                : undefined;
            return { ...peer, sha3WithinRange, randomxWithinRange };
        }) as ConnectedPeerInfoExtended[];
    }, [peers, randomXStats?.height, sha3Stats?.height]);

    return (
        <SettingsGroupWrapper>
            <SettingsGroupTitle style={{ alignItems: 'baseline' }}>
                <Typography variant="h6">{t('p2pool-stats')}</Typography>
                {connectedSince ? <Typography variant="p">{`Connected since: ${connectedSince}`}</Typography> : null}
            </SettingsGroupTitle>
            <Divider />

            <P2PConnectionData />

            <CardContainer>
                <CardComponent
                    heading={t('network-info')}
                    labels={[
                        {
                            labelText: 'established incoming',
                            labelValue: connectionInfo?.network_info?.connection_counters?.established_incoming || '-',
                        },
                        {
                            labelText: 'established outgoing',
                            labelValue: connectionInfo?.network_info?.connection_counters?.established_outgoing || '-',
                        },
                        {
                            labelText: 'pending incoming',
                            labelValue: connectionInfo?.network_info?.connection_counters?.pending_incoming || '-',
                        },
                        {
                            labelText: 'pending outgoing',
                            labelValue: connectionInfo?.network_info?.connection_counters?.pending_outgoing || '-',
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

            <Divider />
            {displayPeers?.length ? (
                <>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{`Connected Peers: ${displayPeers?.length}`}</Typography>
                    </SettingsGroupTitle>
                    {displayPeers ? <PeerTable peers={displayPeers} /> : null}
                </>
            ) : null}
        </SettingsGroupWrapper>
    );
};

export default P2PoolStats;
