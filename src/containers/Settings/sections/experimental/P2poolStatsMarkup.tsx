import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import formatBalance from '@app/utils/formatBalance';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { useP2poolStatsStore } from '@app/store/useP2poolStatsStore';
import { useWalletStore } from '@app/store/useWalletStore';
import { useEffect } from 'react';
import { CardContainer } from '@app/containers/Settings/components/Settings.styles.tsx';
import { CardComponent } from '@app/containers/Settings/components/Card.component.tsx';
import { SettingsGroupWrapper } from '@app/containers/Settings/components/SettingsGroup.styles.ts';

const P2PoolStats = () => {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const walletAddress = useWalletStore((s) => s.tari_address_base58);
    const isP2poolEnabled = useAppConfigStore((s) => s.p2pool_enabled);
    const p2poolSha3Stats = useP2poolStatsStore((s) => s.sha3);
    const p2poolRandomXStats = useP2poolStatsStore((s) => s.randomx);
    const fetchP2pStats = useP2poolStatsStore((s) => s.fetchP2poolStats);

    const p2poolSquad = p2poolSha3Stats?.squad?.name;
    const p2poolSha3MinersCount = p2poolSha3Stats?.num_of_miners;
    const p2poolRandomxMinersCount = p2poolRandomXStats?.num_of_miners;
    const p2poolSha3HashRate = p2poolSha3Stats?.pool_hash_rate;
    const p2poolRandomxHashRate = p2poolRandomXStats?.pool_hash_rate;
    const p2poolSha3TotalEarnings = p2poolSha3Stats?.pool_total_earnings;
    const p2poolRandomxTotalEarnings = p2poolRandomXStats?.pool_total_earnings;
    const p2poolSha3ChainTip = p2poolSha3Stats?.share_chain_height;
    const p2poolRandomxChainTip = p2poolRandomXStats?.share_chain_height;
    const p2poolSha3UserTotalEarnings = walletAddress ? p2poolSha3Stats?.total_earnings[walletAddress] : 0;
    const p2poolRandomxUserTotalEarnings = walletAddress ? p2poolRandomXStats?.total_earnings[walletAddress] : 0;
    const p2poolUserTotalEarnings =
        p2poolSha3UserTotalEarnings && p2poolRandomxUserTotalEarnings
            ? p2poolSha3UserTotalEarnings + p2poolRandomxUserTotalEarnings
            : 0;

    useEffect(() => {
        if (isP2poolEnabled) {
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
        }
    }, [fetchP2pStats, isP2poolEnabled]);

    return isP2poolEnabled ? (
        <SettingsGroupWrapper>
            <Stack>
                <Typography variant="h6">{t('p2pool-stats', { ns: 'settings' })}</Typography>
                <CardContainer>
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
                                labelValue: '' + p2poolSha3MinersCount,
                            },
                            {
                                labelText: 'RandomX',
                                labelValue: '' + p2poolRandomxMinersCount,
                            },
                        ]}
                    />
                    <CardComponent
                        heading={`${t('p2pool-hash-rate', { ns: 'settings' })}`}
                        labels={[
                            {
                                labelText: 'SHA-3',
                                labelValue: (p2poolSha3HashRate ? p2poolSha3HashRate / 1_000_000 : 0) + ' MH/s',
                            },
                            {
                                labelText: 'RandomX',
                                labelValue: (p2poolRandomxHashRate ? p2poolRandomxHashRate / 1_000 : 0) + ' kH/s',
                            },
                        ]}
                    />
                    <CardComponent
                        heading={`${t('p2pool-total-earnings', { ns: 'settings' })}`}
                        labels={[
                            {
                                labelText: 'SHA-3',
                                labelValue:
                                    (p2poolSha3TotalEarnings ? formatBalance(p2poolSha3TotalEarnings) : 0) + ' tXTM',
                            },
                            {
                                labelText: 'RandomX',
                                labelValue:
                                    (p2poolRandomxTotalEarnings ? formatBalance(p2poolRandomxTotalEarnings) : 0) +
                                    ' tXTM',
                            },
                        ]}
                    />
                    <CardComponent
                        heading={`${t('p2pool-chain-tip', { ns: 'settings' })}`}
                        labels={[
                            {
                                labelText: 'SHA-3',
                                labelValue: '#' + p2poolSha3ChainTip,
                            },
                            {
                                labelText: 'RandomX',
                                labelValue: '#' + p2poolRandomxChainTip,
                            },
                        ]}
                    />
                    <CardComponent
                        heading={`${t('p2pool-user-total-earnings', { ns: 'settings' })}`}
                        labels={[
                            {
                                labelText: 'SHA-3',
                                labelValue:
                                    (p2poolSha3UserTotalEarnings ? formatBalance(p2poolSha3UserTotalEarnings) : 0) +
                                    ' tXTM',
                            },
                            {
                                labelText: 'RandomX',
                                labelValue:
                                    (p2poolRandomxUserTotalEarnings
                                        ? formatBalance(p2poolRandomxUserTotalEarnings)
                                        : 0) + ' tXTM',
                            },
                            {
                                labelText: 'Total',
                                labelValue: formatBalance(p2poolUserTotalEarnings) + ' tXTM',
                            },
                        ]}
                    />
                </CardContainer>
            </Stack>
        </SettingsGroupWrapper>
    ) : null;
};

export default P2PoolStats;
