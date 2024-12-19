import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

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
import { timeAgo } from '@app/utils/getTimeAgo.ts';

export type ConnectedPeerInfoExtended = ConnectedPeerInfo & {
    sha3Diff?: number;
    randomxDiff?: number;
};

const P2PoolStats = () => {
    const { t } = useTranslation('p2p', { useSuspense: false });
    const connectedSince = useP2poolStatsStore((s) => s?.connected_since);
    const sha3Stats = useP2poolStatsStore((s) => s?.sha3x_stats);
    const randomXStats = useP2poolStatsStore((s) => s?.randomx_stats);
    const peers = useP2poolStatsStore((s) => s?.peers);
    const fetchP2pStats = useP2poolStatsStore((s) => s?.fetchP2poolStats);
    const fetchP2poolConnections = useP2poolStatsStore((s) => s?.fetchP2poolConnections);

    useEffect(() => {
        const handleFetchP2pStats = async () => {
            await fetchP2pStats?.();
            await fetchP2poolConnections?.();
        };
        handleFetchP2pStats();
        const fetchP2pStatsInterval = setInterval(handleFetchP2pStats, 5000);
        return () => {
            clearInterval(fetchP2pStatsInterval);
        };
    }, [fetchP2pStats, fetchP2poolConnections]);

    const displayPeers = useMemo(() => {
        const sha3Height = sha3Stats?.height;
        const randomXHeight = randomXStats?.height;
        return peers?.map((peer) => {
            const { current_sha3x_height, current_random_x_height } = peer?.peer_info || {};
            const sha3Diff = sha3Height ? sha3Height - current_sha3x_height : undefined;
            const randomxDiff = randomXHeight ? randomXHeight - current_random_x_height : undefined;

            const sha3DiffInRange = sha3Diff && Math.abs(sha3Diff) <= 3 ? 0 : sha3Diff;
            const randomxDiffInRange = randomxDiff && Math.abs(randomxDiff) <= 3 ? 0 : randomxDiff;

            return { ...peer, sha3Diff: sha3DiffInRange, randomxDiff: randomxDiffInRange };
        }) as ConnectedPeerInfoExtended[];
    }, [peers, randomXStats?.height, sha3Stats?.height]);

    return (
        <SettingsGroupWrapper>
            <SettingsGroupTitle style={{ alignItems: 'baseline' }}>
                <Typography variant="h6">{t('p2pool-stats')}</Typography>
                {connectedSince ? (
                    <Typography variant="p">{`Connected since: ${timeAgo(+connectedSince)}`}</Typography>
                ) : null}
            </SettingsGroupTitle>
            <Divider />
            <P2PConnectionData />
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
