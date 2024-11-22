import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { CardComponent } from '@app/containers/floating/Settings/components/Card.component';
import { CardContainer } from '@app/containers/floating/Settings/components/Settings.styles';
import { SettingsGroupWrapper } from '@app/containers/floating/Settings/components/SettingsGroup.styles';

import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { useP2poolStatsStore } from '@app/store/useP2poolStatsStore';

const P2PoolStats = () => {
    const { t } = useTranslation('p2p', { useSuspense: false });
    const isP2poolEnabled = useAppConfigStore((s) => s.p2pool_enabled);
    const p2poolStats = useP2poolStatsStore((s) => s);
    const p2poolSha3Stats = useP2poolStatsStore((s) => s?.sha3x_stats);
    const p2poolRandomXStats = useP2poolStatsStore((s) => s?.randomx_stats);
    const fetchP2pStats = useP2poolStatsStore((s) => s?.fetchP2poolStats);

    const p2poolSquad = p2poolSha3Stats?.squad?.name;
    const p2poolSha3MinersCount = p2poolSha3Stats?.num_of_miners;
    const p2poolRandomxMinersCount = p2poolRandomXStats?.num_of_miners;
    const p2poolSha3ChainTip = p2poolSha3Stats?.share_chain_height;
    const p2poolRandomxChainTip = p2poolRandomXStats?.share_chain_height;

    useEffect(() => {
        const fetchP2pStatsInterval = setInterval(async () => {
            try {
                await fetchP2pStats();
            } catch (error) {
                console.error('Error fetching p2pool stats:', error);
            }
        }, 5000);

        return () => {
            clearInterval(fetchP2pStatsInterval);
        };
    }, [fetchP2pStats]);

    return isP2poolEnabled ? (
        <SettingsGroupWrapper>
            <Stack>
                <Typography variant="h6">{t('p2pool-stats')}</Typography>

                <CardContainer>
                    <CardComponent
                        heading={`${t('p2pool-connection-info')}`}
                        labels={[
                            {
                                labelText: t('p2pool-connected'),
                                labelValue: p2poolStats?.connected ? 'Yes' : 'No',
                            },
                            {
                                labelText: 'Connected peers',
                                labelValue: '' + (p2poolStats?.connection_info?.connected_peers ?? 0),
                            },
                        ]}
                    />
                    <CardComponent
                        heading={`${t('tribe')}`}
                        labels={[
                            {
                                labelText: 'Current',
                                labelValue: p2poolSquad ? p2poolSquad : '',
                            },
                        ]}
                    />

                    <CardComponent
                        heading={`${t('miners')}`}
                        labels={[
                            {
                                labelText: 'SHA-3',
                                labelValue: '' + (p2poolSha3MinersCount ?? 0),
                            },
                            {
                                labelText: 'RandomX',
                                labelValue: '' + (p2poolRandomxMinersCount ?? 0),
                            },
                        ]}
                    />
                    <CardComponent
                        heading={`${t('p2pool-chain-tip')}`}
                        labels={[
                            {
                                labelText: 'SHA-3',
                                labelValue: '#' + (p2poolSha3ChainTip ?? 0),
                            },
                            {
                                labelText: 'RandomX',
                                labelValue: '#' + (p2poolRandomxChainTip ?? 0),
                            },
                        ]}
                    />
                    <CardComponent
                        heading={`${t('p2pool-connection-info-more')}`}
                        labels={[
                            {
                                labelText: 'Pending incoming',
                                labelValue:
                                    '' +
                                    (p2poolStats?.connection_info?.network_info.connection_counters.pending_incoming ??
                                        0),
                            },
                            {
                                labelText: 'Pending outgoing',
                                labelValue:
                                    '' +
                                    (p2poolStats?.connection_info?.network_info.connection_counters.pending_outgoing ??
                                        0),
                            },
                            {
                                labelText: 'Established incoming',
                                labelValue:
                                    '' +
                                    (p2poolStats?.connection_info?.network_info.connection_counters
                                        .established_incoming ?? 0),
                            },
                            {
                                labelText: 'Established outgoing',
                                labelValue:
                                    '' +
                                    (p2poolStats?.connection_info?.network_info.connection_counters
                                        .established_outgoing ?? 0),
                            },
                        ]}
                    />
                </CardContainer>
                <CardContainer>
                    <CardComponent
                        heading="Listener Addresses"
                        labels={[
                            {
                                labelText: 'Address',
                                labelValue: p2poolStats?.connection_info?.listener_addresses.join(', ') || '',
                            },
                        ]}
                    />
                </CardContainer>
            </Stack>
        </SettingsGroupWrapper>
    ) : null;
};

export default P2PoolStats;
