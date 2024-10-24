import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { useP2poolStatsStore } from '@app/store/useP2poolStatsStore';
import { useEffect } from 'react';
import { CardContainer } from '@app/containers/Settings/components/Settings.styles.tsx';
import { CardComponent } from '@app/containers/Settings/components/Card.component.tsx';
import { SettingsGroupWrapper } from '@app/containers/Settings/components/SettingsGroup.styles.ts';
import * as Sentry from '@sentry/react';

const P2PoolStats = () => {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
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
                Sentry.captureException(error);
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
                <Typography variant="h6">{t('p2pool-stats', { ns: 'settings' })}</Typography>
                <CardContainer>
                    <CardComponent
                        heading={`${t('p2pool-connection-info', { ns: 'settings' })}`}
                        labels={[
                            {
                                labelText: 'Address',
                                labelValue: p2poolStats?.connection_info?.listener_addresses.join(', ') || '',
                            },
                            {
                                labelText: 'Connected peers',
                                labelValue: '' + (p2poolStats?.connection_info?.connected_peers ?? 0),
                            },
                        ]}
                    />
                </CardContainer>
                <CardContainer>
                    <CardComponent
                        heading={`${t('p2pool-connected', { ns: 'settings' })}`}
                        labels={[
                            {
                                labelText: 'Connected',
                                labelValue: p2poolStats?.connected ? 'Yes' : 'No',
                            },
                        ]}
                    />
                    <CardComponent
                        heading={`${t('p2pool-connection-info-more', { ns: 'settings' })}`}
                        labels={[
                            {
                                labelText: 'Num Peers',
                                labelValue: '' + (p2poolStats?.connection_info?.network_info.num_peers ?? 0),
                            },
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
                    <CardComponent
                        heading={`${t('tribe', { ns: 'settings' })}`}
                        labels={[
                            {
                                labelText: 'Current',
                                labelValue: p2poolSquad ? p2poolSquad : '',
                            },
                        ]}
                    />
                    <CardComponent
                        heading={`${t('miners', { ns: 'settings' })}`}
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
                        heading={`${t('p2pool-chain-tip', { ns: 'settings' })}`}
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
                </CardContainer>
            </Stack>
        </SettingsGroupWrapper>
    ) : null;
};

export default P2PoolStats;
